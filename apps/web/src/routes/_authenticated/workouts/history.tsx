import { createFileRoute } from '@tanstack/react-router';
import { WorkoutHistoryPage } from '@/pages/workouts/history/WorkoutHistoryPage';
import { workoutsQueryOptions } from '@/pages/workouts/workouts.query';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/workouts/history')({
  loader: ({ context }) => context.queryClient.ensureQueryData(workoutsQueryOptions()),
  component: WorkoutHistoryPage,
  head: () => ({ meta: [{ title: translate({ en: 'All workouts', pl: 'Wszystkie treningi' }) }] }),
  staticData: {
    layout: 'task',
    navbar: {
      backFallback: { to: '/workouts' },
      label: { en: 'All workouts', pl: 'Wszystkie treningi' },
    },
  },
});
