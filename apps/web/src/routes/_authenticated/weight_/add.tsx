import { createFileRoute } from '@tanstack/react-router';
import { AddWeightPage } from '@/pages/weight/AddWeightPage';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/weight_/add')({
  component: AddWeightPage,
  head: () => ({
    meta: [{ title: translate({ en: 'Add weight for date', pl: 'Dodaj wagę dla daty' }) }],
  }),
  staticData: {
    layout: 'task',
    navbar: { backFallback: { to: '/weight' }, label: { en: 'Add weight', pl: 'Dodaj wagę' } },
  },
});
