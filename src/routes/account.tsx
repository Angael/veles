import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/pages/placeholder/PlaceholderPage';

export const Route = createFileRoute('/account')({
  component: AccountPage,
  head: () => ({ meta: [{ title: 'Account' }] }),
  staticData: { navbar: { label: 'Account', upTo: { to: '/' } } },
});

function AccountPage() {
  return (
    <PlaceholderPage
      description='Placeholder route for account details and preferences.'
      eyebrow='Profile'
      title='Account'
    />
  );
}
