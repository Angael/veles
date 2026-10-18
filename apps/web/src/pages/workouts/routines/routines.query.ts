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
  return useMutation({
    meta: { error: { title: 'Could not start the routine' }, invalidateQueryKey: workoutKeys.all },
    mutationFn: (variables: { routineId: string; date: string }) =>
      startRoutine({ data: variables }),
  });
}

/** Also refreshes the session, which is now linked to the new routine. */
export function useSaveRoutineFromWorkoutMutation() {
  return useMutation({
    meta: {
      error: { title: 'Routine was not saved' },
      invalidateQueryKey: workoutKeys.all,
      success: { title: 'Saved as a routine' },
    },
    mutationFn: (variables: { workoutId: string; name: string; description?: string }) =>
      saveRoutineFromWorkout({ data: variables }),
  });
}

export function useUpdateRoutineFromWorkoutMutation() {
  return useMutation({
    meta: {
      error: { title: 'Routine was not updated' },
      invalidateQueryKey: routinesKey,
      success: { title: 'Routine updated' },
    },
    mutationFn: (variables: { workoutId: string }) => updateRoutineFromWorkout({ data: variables }),
  });
}

export function useUpdateRoutineMutation() {
  return useMutation({
    meta: { error: { title: 'Routine was not saved' }, invalidateQueryKey: workoutKeys.all },
    mutationFn: (variables: { id: string; name?: string; description?: string }) =>
      updateRoutine({ data: variables }),
  });
}

export function useDeleteRoutineMutation() {
  return useMutation({
    meta: {
      error: { title: 'Routine was not deleted' },
      invalidateQueryKey: routinesKey,
      success: { title: 'Routine deleted' },
    },
    mutationFn: (variables: { id: string }) => deleteRoutine({ data: variables }),
  });
}
