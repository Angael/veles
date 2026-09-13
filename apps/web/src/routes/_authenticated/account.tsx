import { createFileRoute } from '@tanstack/react-router';
import { AccountPage } from '@/pages/account/AccountPage';

export const Route = createFileRoute('/_authenticated/account')({
  component: AccountPageRoute,
  head: () => ({ meta: [{ title: 'Account' }] }),
  staticData: { navbar: { label: 'Account', upTo: { to: '/' } } },
});

function AccountPageRoute() {
  const { user } = Route.useRouteContext();

  if (!user) {
    return null;
  }

  return <AccountPage user={user} />;
}
