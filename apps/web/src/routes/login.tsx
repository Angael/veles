import { createFileRoute } from '@tanstack/react-router';
import { type } from 'arktype';
import { LoginPage, LoginPendingPage } from '@/pages/login/LoginPage';

export const Route = createFileRoute('/login')({
  validateSearch: type({ 'redirect?': 'string' }),
  component: LoginPage,
  pendingComponent: LoginPendingPage,
  ssr: false,
});
