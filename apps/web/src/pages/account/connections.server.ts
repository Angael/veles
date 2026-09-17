import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { connectionInvitations, userConnections } from '@veles/db/schema';
import { invariant } from '@/lib/invariant';
import { db } from '@/server/db.server';
import { type } from 'arktype';
import { getServerEnv } from '@/server/env.server';

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
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function canonicalConnection(firstUserId: string, secondUserId: string) {
  return firstUserId < secondUserId
    ? { userHighId: secondUserId, userLowId: firstUserId }
    : { userHighId: firstUserId, userLowId: secondUserId };
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
          eq(connectionInvitations.tokenHash, hashToken(token)),
          eq(connectionInvitations.recipientEmail, user.email.toLowerCase()),
        ),
      )
      .returning({ inviterUserId: connectionInvitations.inviterUserId });
    const invitation = invitationRows[0];

    invariant(invitation, 'Connection invitation not found.');

    await tx
      .insert(userConnections)
      .values(canonicalConnection(user.id, invitation.inviterUserId))
      .onConflictDoNothing();
  });
}

const resendErrorResponseType = type({
  'message?': '0 < string <= 500',
  'name?': '0 < string <= 100',
});

/** Extracts bounded provider diagnostics while tolerating non-JSON rejection bodies. */
async function describeResendRejection(response: Response) {
  try {
    const body = resendErrorResponseType(await response.json());

    if (!(body instanceof type.errors)) {
      const detail = [body.name, body.message].filter(Boolean).join(': ');
      if (detail)
        return `Resend rejected the invitation email with status ${response.status}: ${detail}`;
    }
  } catch {}

  return `Resend rejected the invitation email with status ${response.status}.`;
}

/** Sends one connection invitation without exposing the Resend credential to client code. */
export async function sendConnectionInvitationEmail({
  inviterName,
  recipientEmail,
  token,
}: SendConnectionInvitationOptions) {
  const env = getServerEnv();

  if (!env.resendApiKey || !env.invitationEmailFrom) {
    throw new Error('Connection invitation email is not configured.');
  }

  const invitationUrl = new URL(`/invite/${token}`, env.appUrl);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.invitationEmailFrom,
      to: [recipientEmail],
      subject: `${inviterName} invited you to connect on Veles`,
      text: `${inviterName} invited you to connect on Veles. Sign in with ${recipientEmail} to accept the invitation: ${invitationUrl.toString()}`,
    }),
  });

  if (!response.ok) {
    throw new Error(await describeResendRejection(response));
  }
}
