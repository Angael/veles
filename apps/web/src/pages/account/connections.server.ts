import { getServerEnv } from '@/server/env.server';

interface SendConnectionInvitationOptions {
  recipientEmail: string;
  inviterName: string;
  token: string;
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

  const invitationUrl = new URL('/account', env.appUrl);
  invitationUrl.searchParams.set('invitation', token);
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
      text: `${inviterName} invited you to connect on Veles. Sign in with ${recipientEmail} and review the invitation: ${invitationUrl.toString()}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected the invitation email with status ${response.status}.`);
  }
}
