import { createFileRoute } from '@tanstack/react-router';
import { SignupPage, SignupPendingPage } from '@/pages/signup/SignupPage';

export const Route = createFileRoute('/signup')({
  component: SignupPage,
  pendingComponent: SignupPendingPage,
  ssr: false,
});
