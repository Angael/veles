import { createFileRoute } from '@tanstack/react-router';
import { ImportWeightPage } from '@/pages/weight/ImportWeightPage';

export const Route = createFileRoute('/_authenticated/weight_/import')({
  component: ImportWeightPage,
  head: () => ({ meta: [{ title: 'Import weight history' }] }),
  staticData: { navbar: { label: 'Import weights', upTo: { to: '/weight' } } },
});
