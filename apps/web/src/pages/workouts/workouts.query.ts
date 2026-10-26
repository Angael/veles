import { queryOptions, useMutation } from '@tanstack/react-query';
import {
  deleteWorkout,
  getWorkouts,
  getWorkoutSession,
  startWorkout,
  updateWorkout,
} from './workouts.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

export const workoutKeys = {
  all: ['workouts'] as const,
  list: ['workouts', 'list'] as const,
  session: (id: string) => ['workouts', 'session', id] as const,
};

export function workoutsQueryOptions() {
  return queryOptions({ queryFn: () => getWorkouts(), queryKey: workoutKeys.list });
}

export function workoutSessionQueryOptions(id: string) {
  return queryOptions({
    queryFn: () => getWorkoutSession({ data: { id } }),
    queryKey: workoutKeys.session(id),
  });
}

export function useStartWorkoutMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({ en: 'Could not start a workout', pl: 'Nie udało się rozpocząć treningu' }),
      },
      invalidateQueryKey: workoutKeys.list,
    },
    mutationFn: (variables: { date: string }) => startWorkout({ data: variables }),
  });
}

export function useUpdateWorkoutMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Workout was not saved', pl: 'Nie udało się zapisać treningu' }) },
      invalidateQueryKey: workoutKeys.all,
    },
    mutationFn: (variables: { id: string; name?: string; finished?: boolean }) =>
      updateWorkout({ data: variables }),
  });
}

/** Moves a session to another local day; the list, calendar and session refresh. */
export function useMoveWorkoutMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Workout was not moved', pl: 'Nie udało się przenieść treningu' }) },
      invalidateQueryKey: workoutKeys.all,
    },
    mutationFn: (variables: { id: string; date: string }) => updateWorkout({ data: variables }),
  });
}

export function useDeleteWorkoutMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Workout was not deleted', pl: 'Nie udało się usunąć treningu' }) },
      invalidateQueryKey: workoutKeys.list,
    },
    mutationFn: (variables: { id: string }) => deleteWorkout({ data: variables }),
  });
}
