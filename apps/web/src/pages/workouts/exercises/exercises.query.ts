import { queryOptions, useMutation } from '@tanstack/react-query';
import { workoutKeys } from '../workouts.query';
import type { updateExerciseInputType } from '../workouts.validation';
import {
  deleteExercise,
  getExerciseHistory,
  getExerciseLibrary,
  getExercises,
  updateExercise,
} from './exercises.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

export const exerciseKeys = {
  all: ['workouts', 'exercises'] as const,
  library: ['workouts', 'exercises', 'library'] as const,
  history: (exerciseId: string, excludeWorkoutId?: string) =>
    ['workouts', 'exercises', 'history', exerciseId, excludeWorkoutId ?? null] as const,
};

export function exercisesQueryOptions() {
  return queryOptions({ queryFn: () => getExercises(), queryKey: exerciseKeys.all });
}

export function exerciseLibraryQueryOptions() {
  return queryOptions({ queryFn: () => getExerciseLibrary(), queryKey: exerciseKeys.library });
}

export function exerciseHistoryQueryOptions(exerciseId: string, excludeWorkoutId?: string) {
  return queryOptions({
    queryFn: () => getExerciseHistory({ data: { exerciseId, excludeWorkoutId } }),
    queryKey: exerciseKeys.history(exerciseId, excludeWorkoutId),
  });
}

/** Names and tracking show in sessions and routines too, so everything workout-related reloads. */
export function useUpdateExerciseMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Exercise was not saved', pl: 'Nie udało się zapisać ćwiczenia' }) },
      invalidateQueryKey: workoutKeys.all,
    },
    mutationFn: (variables: typeof updateExerciseInputType.infer) =>
      updateExercise({ data: variables }),
  });
}

export function useDeleteExerciseMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Exercise was not deleted', pl: 'Nie udało się usunąć ćwiczenia' }) },
      invalidateQueryKey: exerciseKeys.all,
      success: { title: t({ en: 'Exercise deleted', pl: 'Usunięto ćwiczenie' }) },
    },
    mutationFn: (variables: { id: string }) => deleteExercise({ data: variables }),
  });
}
