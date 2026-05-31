import { createFileRoute } from '@tanstack/react-router';
import { WeightPage } from '@/pages/weight/WeightPage';

export const Route = createFileRoute('/weight')({
  component: WeightPage,
});
