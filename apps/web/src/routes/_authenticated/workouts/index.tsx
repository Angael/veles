import { createFileRoute } from '@tanstack/react-router';
import { workoutsQueryOptions } from '@/pages/workouts/workouts.query';
import { WorkoutsPage } from '@/pages/workouts/WorkoutsPage';

export const Route = createFileRoute('/_authenticated/workouts/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(workoutsQueryOptions()),
  component: WorkoutsPage,
  head: () => ({ meta: [{ title: 'Workouts' }] }),
  staticData: { navbar: { label: 'Workouts' } },
});
