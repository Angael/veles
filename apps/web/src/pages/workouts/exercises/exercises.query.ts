import { queryOptions } from '@tanstack/react-query';
import { getExerciseHistory, getExercises } from './exercises.api';

export const exerciseKeys = {
  all: ['workouts', 'exercises'] as const,
  history: (exerciseId: string, excludeWorkoutId?: string) =>
    ['workouts', 'exercises', 'history', exerciseId, excludeWorkoutId ?? null] as const,
};

export function exercisesQueryOptions() {
  return queryOptions({ queryFn: () => getExercises(), queryKey: exerciseKeys.all });
}

export function exerciseHistoryQueryOptions(exerciseId: string, excludeWorkoutId?: string) {
  return queryOptions({
    queryFn: () => getExerciseHistory({ data: { exerciseId, excludeWorkoutId } }),
    queryKey: exerciseKeys.history(exerciseId, excludeWorkoutId),
  });
}
