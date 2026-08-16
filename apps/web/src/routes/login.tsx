import { createFileRoute, redirect } from '@tanstack/react-router';
import { type } from 'arktype';
import { LoginPage, LoginPendingPage } from '@/pages/login/LoginPage';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';

export const Route = createFileRoute('/login')({
  validateSearch: type({ 'redirect?': 'string' }),
  beforeLoad: ({ context, search }) => {
    if (context.user) {
      throw redirect({ to: getSafeRedirectPath(search.redirect) });
    }
  },
  component: LoginPage,
  pendingComponent: LoginPendingPage,
  ssr: false,
});
