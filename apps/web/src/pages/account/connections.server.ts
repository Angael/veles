import { hash } from 'node:crypto';
import { and, eq, or } from 'drizzle-orm';
import { Resend } from 'resend';
import { connectionInvitations, userConnections, users } from '@veles/db/schema';
import { invariant } from '@/lib/invariant';
import { db } from '@/server/db.server';
import { getServerEnv } from '@/server/env.server';
import { ConnectionInvitationEmail } from '@/server/email/ConnectionInvitationEmail';

interface SendConnectionInvitationOptions {
  recipientEmail: string;
  inviterName: string;
  token: string;
}
interface AcceptConnectionInvitationTokenOptions {
  token: string;
  user: {
    email: string;
    id: string;
  };
}

export function canonicalConnection(firstUserId: string, secondUserId: string) {
  return firstUserId < secondUserId
    ? { userHighId: secondUserId, userLowId: firstUserId }
    : { userHighId: firstUserId, userLowId: secondUserId };
}

export function connectionInvitationsBetween(
  firstUser: { email: string; id: string },
  secondUser: { email: string; id: string },
) {
  return or(
    and(
      eq(connectionInvitations.inviterUserId, firstUser.id),
      eq(connectionInvitations.recipientEmail, secondUser.email.toLowerCase()),
    ),
    and(
      eq(connectionInvitations.inviterUserId, secondUser.id),
      eq(connectionInvitations.recipientEmail, firstUser.email.toLowerCase()),
    ),
  );
}

/** Consumes a matching invitation and creates the connection as one transaction. */
export async function acceptConnectionInvitationTokenForUser({
  token,
  user,
}: AcceptConnectionInvitationTokenOptions) {
  await db.transaction(async (tx) => {
    const invitationRows = await tx
      .delete(connectionInvitations)
      .where(
        and(
          eq(connectionInvitations.tokenHash, hash('sha256', token)),
          eq(connectionInvitations.recipientEmail, user.email.toLowerCase()),
        ),
      )
      .returning({ inviterUserId: connectionInvitations.inviterUserId });
    const invitation = invitationRows[0];

    invariant(invitation, 'Connection invitation not found.');

    const inviterRows = await tx
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, invitation.inviterUserId))
      .limit(1);
    const inviter = inviterRows[0];

    invariant(inviter, 'Connection invitation sender not found.');

    await tx
      .insert(userConnections)
      .values(canonicalConnection(user.id, invitation.inviterUserId))
      .onConflictDoNothing();
    // Remove the reciprocal invite so it cannot restore a connection after a later disconnect.
    await tx.delete(connectionInvitations).where(
      connectionInvitationsBetween(user, {
        email: inviter.email,
        id: invitation.inviterUserId,
      }),
    );
  });
}

/** Sends one connection invitation without exposing the Resend credential to client code. */
export async function sendConnectionInvitationEmail({
  inviterName,
  recipientEmail,
  token,
}: SendConnectionInvitationOptions) {
  const env = getServerEnv();
  invariant(env.resendApiKey, 'Connection invitation email is not configured.');
  invariant(env.invitationEmailFrom, 'Connection invitation email is not configured.');

  const invitationUrl = new URL(`/invite/${token}`, env.appUrl).toString();
  const resend = new Resend(env.resendApiKey);
  const { error } = await resend.emails.send({
    from: env.invitationEmailFrom,
    to: [recipientEmail],
    subject: `${inviterName} invited you to connect on Veles`,
    react: ConnectionInvitationEmail({ invitationUrl, inviterName, recipientEmail }),
  });
  invariant(
    !error,
    error
      ? `Resend rejected the invitation email: ${error.name}: ${error.message}`
      : 'Resend rejected the invitation email.',
  );
}
