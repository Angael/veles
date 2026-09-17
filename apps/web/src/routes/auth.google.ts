import { createFileRoute } from '@tanstack/react-router';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';
import { auth } from '@/server/auth.server';

export const Route = createFileRoute('/auth/google')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const callbackURL = getSafeRedirectPath(
          requestUrl.searchParams.get('redirect') ?? undefined,
        );
        const session = await auth.api.getSession({ headers: request.headers });

        if (session) {
          return Response.redirect(new URL(callbackURL, requestUrl.origin));
        }

        const response = await auth.api.signInSocial({
          body: {
            callbackURL,
            disableRedirect: true,
            provider: 'google',
          },
          headers: request.headers,
        });

        if (!response.url) {
          return Response.redirect(new URL('/auth/error', requestUrl.origin));
        }

        return new Response(null, {
          headers: { 'Cache-Control': 'no-store', Location: response.url },
          status: 302,
        });
      },
    },
  },
});
