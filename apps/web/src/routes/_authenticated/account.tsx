import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { AccountPage } from '@/pages/account/AccountPage';

export const Route = createFileRoute('/_authenticated/account')({
  component: AccountPageRoute,
  validateSearch: type({ 'invitation?': 'string' }),
  head: () => ({ meta: [{ title: 'Account' }] }),
  staticData: { navbar: { label: 'Account', upTo: { to: '/' } } },
});

function AccountPageRoute() {
  const { user } = Route.useRouteContext();
  const { invitation } = Route.useSearch();

  if (!user) {
    return null;
  }

  return <AccountPage invitation={invitation} user={user} />;
}
