import { createFileRoute } from '@tanstack/react-router';
import { AccountPage } from '@/pages/account/AccountPage';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/account')({
  component: AccountPageRoute,
  head: () => ({ meta: [{ title: translate({ en: 'Account', pl: 'Konto' }) }] }),
  staticData: { navbar: { label: { en: 'Account', pl: 'Konto' } } },
});

function AccountPageRoute() {
  const { user } = Route.useRouteContext();

  if (!user) {
    return null;
  }

  return <AccountPage user={user} />;
}
