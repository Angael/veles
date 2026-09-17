import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { acceptConnectionInvitationTokenForUser } from '@/pages/account/connections.server';
import { auth } from '@/server/auth.server';

const invitationTokenType = type('string == 43');

/** Starts authentication while preserving this invitation as the return destination. */
function startInvitationAuthentication(token: string, origin: string) {
  const googleSignInUrl = new URL('/auth/google', origin);
  googleSignInUrl.searchParams.set('redirect', `/invite/${token}`);
  return Response.redirect(googleSignInUrl);
}

/** Accepts the invitation after authentication, then leaves the invitation route. */
async function completeInvitationAcceptance(
  token: string,
  user: { email: string; id: string },
  origin: string,
) {
  await acceptConnectionInvitationTokenForUser({ token, user });
  return Response.redirect(new URL('/', origin));
}

export const Route = createFileRoute('/invite/$token')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const requestUrl = new URL(request.url);
        const token = invitationTokenType(params.token);

        if (token instanceof type.errors) {
          return Response.redirect(
            new URL('/auth/error?error=invalid_invitation', requestUrl.origin),
          );
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
