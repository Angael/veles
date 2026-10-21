import { queryOptions, useMutation } from '@tanstack/react-query';
import { workoutKeys } from '../workouts.query';
import {
  deleteRoutine,
  getRoutine,
  getRoutines,
  saveRoutineFromWorkout,
  startRoutine,
  updateRoutine,
  updateRoutineFromWorkout,
} from './routines.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

export const routinesKey = ['workouts', 'routines'] as const;

export function routinesQueryOptions() {
  return queryOptions({ queryFn: () => getRoutines(), queryKey: routinesKey });
}

export function routineQueryOptions(id: string) {
  return queryOptions({
    queryFn: () => getRoutine({ data: { id } }),
    queryKey: [...routinesKey, id],
  });
}

export function useStartRoutineMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({ en: 'Could not start the routine', pl: 'Nie udało się rozpocząć planu' }),
      },
      invalidateQueryKey: workoutKeys.all,
    },
    mutationFn: (variables: { routineId: string; date: string }) =>
      startRoutine({ data: variables }),
  });
}

/** Also refreshes the session, which is now linked to the new routine. */
export function useSaveRoutineFromWorkoutMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Routine was not saved', pl: 'Nie udało się zapisać planu' }) },
      invalidateQueryKey: workoutKeys.all,
      success: { title: t({ en: 'Saved as a routine', pl: 'Zapisano jako plan' }) },
    },
    mutationFn: (variables: { workoutId: string; name: string; description?: string }) =>
      saveRoutineFromWorkout({ data: variables }),
  });
}

export function useUpdateRoutineFromWorkoutMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({ en: 'Routine was not updated', pl: 'Nie udało się zaktualizować planu' }),
      },
      invalidateQueryKey: routinesKey,
      success: { title: t({ en: 'Routine updated', pl: 'Zaktualizowano plan' }) },
    },
    mutationFn: (variables: { workoutId: string }) => updateRoutineFromWorkout({ data: variables }),
  });
}

export function useUpdateRoutineMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Routine was not saved', pl: 'Nie udało się zapisać planu' }) },
      invalidateQueryKey: workoutKeys.all,
    },
    mutationFn: (variables: { id: string; name?: string; description?: string }) =>
      updateRoutine({ data: variables }),
  });
}

export function useDeleteRoutineMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Routine was not deleted', pl: 'Nie udało się usunąć planu' }) },
      invalidateQueryKey: routinesKey,
      success: { title: t({ en: 'Routine deleted', pl: 'Usunięto plan' }) },
    },
    mutationFn: (variables: { id: string }) => deleteRoutine({ data: variables }),
  });
}
