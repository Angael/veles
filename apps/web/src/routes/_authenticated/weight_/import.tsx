import { createFileRoute } from '@tanstack/react-router';
import { ImportWeightPage } from '@/pages/weight/ImportWeightPage';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/weight_/import')({
  component: ImportWeightPage,
  head: () => ({
    meta: [{ title: translate({ en: 'Import weight history', pl: 'Importuj historię wagi' }) }],
  }),
  staticData: {
    layout: 'task',
    navbar: {
      backFallback: { to: '/weight' },
      label: { en: 'Import weight history', pl: 'Importuj historię wagi' },
    },
  },
});
