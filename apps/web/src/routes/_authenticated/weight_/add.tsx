import { createFileRoute } from '@tanstack/react-router';
import { AddWeightPage } from '@/pages/weight/AddWeightPage';

export const Route = createFileRoute('/_authenticated/weight_/add')({
  component: AddWeightPage,
  head: () => ({ meta: [{ title: 'Add weight for date' }] }),
  staticData: { navbar: { label: 'Add weight', upTo: { to: '/weight' } } },
});
