import { hash, randomBytes } from 'node:crypto';
import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray, or } from 'drizzle-orm';
import { connectionInvitations, userConnections, users } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { log } from '@/server/logger.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import {
  canonicalConnection,
  connectionInvitationsBetween,
  sendConnectionInvitationEmail,
} from './connections.server';

const invitationIdInputType = type({ id: 'string.uuid' });

/** Loads the signed-in user's connections and both sides of their pending invitations. */
export const getConnections = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getConnections')])
  .handler(async () => {
    const session = await requireSession();
    const [connectionRows, incomingRows, outgoingRows] = await Promise.all([
      db
        .select()
        .from(userConnections)
        .where(
          or(
            eq(userConnections.userLowId, session.user.id),
            eq(userConnections.userHighId, session.user.id),
          ),
        ),
      db
        .select({
          createdAt: connectionInvitations.createdAt,
          id: connectionInvitations.id,
          inviterEmail: users.email,
          inviterImage: users.image,
          inviterName: users.name,
        })
        .from(connectionInvitations)
        .innerJoin(users, eq(users.id, connectionInvitations.inviterUserId))
        .where(eq(connectionInvitations.recipientEmail, session.user.email.toLowerCase())),
      db
        .select({
          createdAt: connectionInvitations.createdAt,
          deliveryFailed: connectionInvitations.deliveryFailed,
          id: connectionInvitations.id,
          recipientEmail: connectionInvitations.recipientEmail,
        })
        .from(connectionInvitations)
        .where(eq(connectionInvitations.inviterUserId, session.user.id)),
    ]);
    const connectedUserIds = connectionRows.map((connection) =>
      connection.userLowId === session.user.id ? connection.userHighId : connection.userLowId,
    );
    const connectedUsers = connectedUserIds.length
      ? await db
          .select({ email: users.email, id: users.id, image: users.image, name: users.name })
          .from(users)
          .where(inArray(users.id, connectedUserIds))
      : [];

    return { connections: connectedUsers, incoming: incomingRows, outgoing: outgoingRows };
  });

const emailType = type('string.email').pipe((email) => email.trim().toLowerCase());
const inviteInputType = type({ email: emailType });

/** Creates or rotates an invitation before attempting its independent email delivery. */
export const sendConnectionInvitation = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('sendConnectionInvitation')])
  .validator(arkTypeValidator(inviteInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    if (data.email === session.user.email.toLowerCase()) {
      throw new ClientSafeError('You cannot invite your own email address.');
    }

    const recipientRows = await db
      .select({ email: users.email, id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);
    const recipient = recipientRows[0];

    if (recipient) {
      const connection = canonicalConnection(session.user.id, recipient.id);
      const existingConnections = await db
        .select({ userLowId: userConnections.userLowId })
        .from(userConnections)
        .where(
          and(
            eq(userConnections.userLowId, connection.userLowId),
            eq(userConnections.userHighId, connection.userHighId),
          ),
        )
        .limit(1);

      // An invite created while connected would become stale consent after a later disconnect.
      if (existingConnections.length > 0) {
        throw new ClientSafeError('You are already connected to this user.');
      }
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = hash('sha256', token);
    const invitationRows = await db
      .insert(connectionInvitations)
      .values({
        inviterUserId: session.user.id,
        recipientEmail: data.email,
        tokenHash,
      })
      .onConflictDoUpdate({
        target: [connectionInvitations.inviterUserId, connectionInvitations.recipientEmail],
        set: {
          deliveryFailed: false,
          tokenHash,
          updatedAt: new Date(),
        },
      })
      .returning({ id: connectionInvitations.id });
    const invitation = invitationRows[0];

    if (!invitation) {
      throw new Error('Connection invitation could not be saved.');
    }

    try {
      await sendConnectionInvitationEmail({
        inviterName: session.user.name,
        recipientEmail: data.email,
        token,
      });
      log.info('Connection invitation email sent', { recipientEmail: data.email });
      return { delivered: true };
    } catch (error) {
      log.error('Connection invitation email delivery failed', {
        recipientEmail: data.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n') : undefined,
      });
      await db
        .update(connectionInvitations)
        .set({ deliveryFailed: true, updatedAt: new Date() })
        .where(eq(connectionInvitations.id, invitation.id));
      return { delivered: false };
    }
  });

/** Accepts an invitation only for the authenticated account matching its recipient email. */
export const acceptConnectionInvitation = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('acceptConnectionInvitation')])
  .validator(arkTypeValidator(invitationIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    // This read intentionally stays outside the transaction: simultaneous revoke and accept is
    // not a realistic concern for this hobby app, and the simpler flow is preferred.
    const invitationRows = await db
      .select({
        inviterEmail: users.email,
        inviterUserId: connectionInvitations.inviterUserId,
      })
      .from(connectionInvitations)
      .innerJoin(users, eq(users.id, connectionInvitations.inviterUserId))
      .where(
        and(
          eq(connectionInvitations.id, data.id),
          eq(connectionInvitations.recipientEmail, session.user.email.toLowerCase()),
        ),
      )
      .limit(1);
    const invitation = invitationRows[0];

    if (!invitation) {
      throw new ClientSafeError('This invitation is no longer available.');
    }

    await db.transaction(async (tx) => {
      await tx
        .insert(userConnections)
        .values(canonicalConnection(session.user.id, invitation.inviterUserId))
        .onConflictDoNothing();
      // Clear the reciprocal invite so it cannot restore this connection after a later disconnect.
      await tx.delete(connectionInvitations).where(
        connectionInvitationsBetween(session.user, {
          email: invitation.inviterEmail,
          id: invitation.inviterUserId,
        }),
      );
    });
  });

/** Removes a pending invitation when its sender revokes it or its recipient declines it. */
export const removeConnectionInvitation = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('removeConnectionInvitation')])
  .validator(arkTypeValidator(invitationIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db
      .delete(connectionInvitations)
      .where(
        and(
          eq(connectionInvitations.id, data.id),
          or(
            eq(connectionInvitations.inviterUserId, session.user.id),
            eq(connectionInvitations.recipientEmail, session.user.email.toLowerCase()),
          ),
        ),
      );
  });

const connectionUserInputType = type({ userId: 'string >= 1' });

/** Disconnects the authenticated user from one explicitly selected connected account. */
export const disconnectUser = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('disconnectUser')])
  .validator(arkTypeValidator(connectionUserInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const connection = canonicalConnection(session.user.id, data.userId);

    await db.transaction(async (tx) => {
      const disconnectedUserRows = await tx
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1);
      const disconnectedUser = disconnectedUserRows[0];

      await tx
        .delete(userConnections)
        .where(
          and(
            eq(userConnections.userLowId, connection.userLowId),
            eq(userConnections.userHighId, connection.userHighId),
          ),
        );

      if (disconnectedUser) {
        // A disconnect revokes prior consent, so neither direction may retain a reusable invite.
        await tx.delete(connectionInvitations).where(
          connectionInvitationsBetween(session.user, {
            email: disconnectedUser.email,
            id: data.userId,
          }),
        );
      }
    });
  });
