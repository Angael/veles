import { createFileRoute } from '@tanstack/react-router';
import { type } from 'arktype';
import { AuthErrorPage } from '@/pages/login/AuthErrorPage';

export const Route = createFileRoute('/auth/error')({
  validateSearch: type({ 'error?': 'string', 'error_description?': 'string' }),
  component: AuthErrorRoute,
  head: () => ({ meta: [{ title: 'Sign-in error' }] }),
});

function AuthErrorRoute() {
  const { error, error_description: description } = Route.useSearch();

  return <AuthErrorPage code={error} description={description} />;
}
