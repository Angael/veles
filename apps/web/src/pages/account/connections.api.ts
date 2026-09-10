import { createHash, randomBytes } from 'node:crypto';
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
import { sendConnectionInvitationEmail } from './connections.server';

const emailType = type('string.email').pipe((email) => email.trim().toLowerCase());
const inviteInputType = type({ email: emailType });
const invitationIdInputType = type({ id: 'string.uuid' });
const connectionUserInputType = type({ userId: 'string >= 1' });

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function canonicalConnection(firstUserId: string, secondUserId: string) {
  return firstUserId < secondUserId
    ? { userHighId: secondUserId, userLowId: firstUserId }
    : { userHighId: firstUserId, userLowId: secondUserId };
}

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

/** Creates or rotates an invitation before attempting its independent email delivery. */
export const sendConnectionInvitation = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('sendConnectionInvitation')])
  .validator(arkTypeValidator(inviteInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    if (data.email === session.user.email.toLowerCase()) {
      throw new ClientSafeError('You cannot invite your own email address.');
    }

    const token = randomBytes(32).toString('base64url');
    const invitationRows = await db
      .insert(connectionInvitations)
      .values({
        inviterUserId: session.user.id,
        recipientEmail: data.email,
        tokenHash: hashToken(token),
      })
      .onConflictDoUpdate({
        target: [connectionInvitations.inviterUserId, connectionInvitations.recipientEmail],
        set: { deliveryFailed: false, tokenHash: hashToken(token), updatedAt: new Date() },
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
    const invitationRows = await db
      .select({ inviterUserId: connectionInvitations.inviterUserId })
      .from(connectionInvitations)
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
      await tx.delete(connectionInvitations).where(eq(connectionInvitations.id, data.id));
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

/** Disconnects the authenticated user from one explicitly selected connected account. */
export const disconnectUser = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('disconnectUser')])
  .validator(arkTypeValidator(connectionUserInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const connection = canonicalConnection(session.user.id, data.userId);
    await db
      .delete(userConnections)
      .where(
        and(
          eq(userConnections.userLowId, connection.userLowId),
          eq(userConnections.userHighId, connection.userHighId),
        ),
      );
  });
