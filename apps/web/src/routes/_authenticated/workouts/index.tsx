import { createFileRoute } from '@tanstack/react-router';
import { calendarStart } from '@/pages/workouts/dashboard/WorkoutCalendar';
import {
  exerciseProgressQueryOptions,
  workoutCalendarQueryOptions,
} from '@/pages/workouts/dashboard/dashboard.query';
import { WorkoutsDashboardPage } from '@/pages/workouts/dashboard/WorkoutsDashboardPage';
import { routinesQueryOptions } from '@/pages/workouts/routines/routines.query';
import { workoutsQueryOptions } from '@/pages/workouts/workouts.query';

export const Route = createFileRoute('/_authenticated/workouts/')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(workoutsQueryOptions()),
      queryClient.ensureQueryData(routinesQueryOptions()),
      queryClient.ensureQueryData(workoutCalendarQueryOptions(calendarStart())),
      queryClient.ensureQueryData(exerciseProgressQueryOptions()),
    ]),
  component: WorkoutsDashboardPage,
  head: () => ({ meta: [{ title: 'Workouts' }] }),
  staticData: { navbar: { label: 'Workouts' } },
});
