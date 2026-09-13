import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';

const invitationTokenType = type('string == 43');

export const Route = createFileRoute('/invite/$token')({
  server: {
    handlers: {
      GET: ({ params, request }) => {
        const requestUrl = new URL(request.url);
        const token = invitationTokenType(params.token);

        if (token instanceof type.errors) {
          return Response.redirect(
            new URL('/auth/error?error=invalid_invitation', requestUrl.origin),
          );
        }

        const googleSignInUrl = new URL('/auth/google', requestUrl.origin);
        googleSignInUrl.searchParams.set('redirect', `/?invitation=${token}`);
        return Response.redirect(googleSignInUrl);
      },
    },
  },
});
