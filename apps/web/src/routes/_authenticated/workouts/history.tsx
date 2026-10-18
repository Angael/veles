import { createFileRoute } from '@tanstack/react-router';
import { WorkoutHistoryPage } from '@/pages/workouts/history/WorkoutHistoryPage';
import { workoutsQueryOptions } from '@/pages/workouts/workouts.query';

export const Route = createFileRoute('/_authenticated/workouts/history')({
  loader: ({ context }) => context.queryClient.ensureQueryData(workoutsQueryOptions()),
  component: WorkoutHistoryPage,
  head: () => ({ meta: [{ title: 'All workouts' }] }),
  staticData: {
    layout: 'task',
    navbar: { backFallback: { to: '/workouts' }, label: 'All workouts' },
  },
});
