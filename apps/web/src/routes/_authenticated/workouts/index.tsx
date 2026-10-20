import { createFileRoute } from '@tanstack/react-router';
import { calendarStart } from '@/pages/workouts/dashboard/WorkoutCalendar';
import { workoutCalendarQueryOptions } from '@/pages/workouts/dashboard/dashboard.query';
import { WorkoutsDashboardPage } from '@/pages/workouts/dashboard/WorkoutsDashboardPage';
import { routinesQueryOptions } from '@/pages/workouts/routines/routines.query';
import { workoutsQueryOptions } from '@/pages/workouts/workouts.query';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/workouts/')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(workoutsQueryOptions()),
      queryClient.ensureQueryData(routinesQueryOptions()),
      queryClient.ensureQueryData(workoutCalendarQueryOptions(calendarStart())),
    ]),
  component: WorkoutsDashboardPage,
  head: () => ({ meta: [{ title: translate({ en: 'Workouts', pl: 'Treningi' }) }] }),
  staticData: { navbar: { label: { en: 'Workouts', pl: 'Treningi' } } },
});
