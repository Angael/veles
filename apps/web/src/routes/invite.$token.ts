import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import {
  acceptConnectionInvitationTokenForUser,
  connectionInvitationTokenExists,
} from '@/pages/account/connections.server';
import { auth } from '@/server/auth.server';

const invitationTokenType = type('string == 43');
function redirect(location: URL) {
  return new Response(null, {
    headers: { Location: location.toString() },
    status: 302,
  });
}

/** Starts authentication while preserving this invitation as the return destination. */
function startInvitationAuthentication(token: string, origin: string) {
  const googleSignInUrl = new URL('/auth/google', origin);
  googleSignInUrl.searchParams.set('redirect', `/invite/${token}`);
  return redirect(googleSignInUrl);
}

/** Accepts the invitation after authentication, then leaves the invitation route. */
async function completeInvitationAcceptance(
  token: string,
  user: { email: string; id: string },
  origin: string,
) {
  const accepted = await acceptConnectionInvitationTokenForUser({ token, user });
  const destination = accepted ? '/' : '/auth/error?error=invalid_invitation';
  return redirect(new URL(destination, origin));
}

export const Route = createFileRoute('/invite/$token')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const requestUrl = new URL(request.url);
        const token = invitationTokenType(params.token);

        if (token instanceof type.errors) {
          return redirect(new URL('/auth/error?error=invalid_invitation', requestUrl.origin));
        }

        if (!(await connectionInvitationTokenExists(token))) {
          return redirect(new URL('/auth/error?error=invalid_invitation', requestUrl.origin));
        }

        const session = await auth.api.getSession({ headers: request.headers });

        if (!session) {
          return startInvitationAuthentication(token, requestUrl.origin);
        }

        return completeInvitationAcceptance(token, session.user, requestUrl.origin);
      },
    },
  },
});
