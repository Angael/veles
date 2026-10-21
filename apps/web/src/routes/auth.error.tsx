import { createFileRoute } from '@tanstack/react-router';
import { type } from 'arktype';
import { AuthErrorPage } from '@/pages/login/AuthErrorPage';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/auth/error')({
  validateSearch: type({ 'error?': 'string', 'error_description?': 'string' }),
  component: AuthErrorRoute,
  head: () => ({ meta: [{ title: translate({ en: 'Sign-in error', pl: 'Błąd logowania' }) }] }),
});

function AuthErrorRoute() {
  const { error } = Route.useSearch();

  return <AuthErrorPage code={error} />;
}
