import { createFileRoute, redirect } from '@tanstack/react-router';
import { type } from 'arktype';
import { LoginPage } from '@/pages/login/LoginPage';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';

export const Route = createFileRoute('/login')({
  validateSearch: type({ 'redirect?': 'string' }),
  beforeLoad: ({ context, search }) => {
    if (context.user) {
      // oxlint-disable-next-line typescript/only-throw-error -- Router control flow intentionally throws this object.
      throw redirect({ to: getSafeRedirectPath(search.redirect) });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { redirect: redirectPath } = Route.useSearch();
  return <LoginPage redirect={redirectPath} />;
}
