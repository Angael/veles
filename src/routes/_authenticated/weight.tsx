import { createFileRoute } from '@tanstack/react-router';
import { WeightPage } from '@/pages/weight/WeightPage';

export const Route = createFileRoute('/_authenticated/weight')({
  component: WeightPage,
  staticData: { navbar: { label: 'Weight', upTo: { to: '/' } } },
});
