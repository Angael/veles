import { createFileRoute } from '@tanstack/react-router';
import { LoginPage, LoginPendingPage } from '@/pages/login/LoginPage';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  pendingComponent: LoginPendingPage,
  ssr: false,
});
