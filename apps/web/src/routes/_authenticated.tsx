import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.user) {
      // oxlint-disable-next-line typescript/only-throw-error -- Router control flow intentionally throws this object.
      throw redirect({
        to: '/login',
        search: { redirect: getSafeRedirectPath(location.href) },
      });
    }
  },
  component: Outlet,
});
