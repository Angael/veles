import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';
import { getSessionUserId } from '@/lib/auth/getSession';
import { logMiddleware } from '@/lib/middleware/logMiddleware';

const hasSession = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('hasSession')])
  .handler(async () => Boolean(await getSessionUserId()));

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    if (!(await hasSession())) {
      throw redirect({
        to: '/login',
        search: { redirect: getSafeRedirectPath(location.href) },
      });
    }
  },
  component: Outlet,
});
