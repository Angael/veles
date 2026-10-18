import { queryOptions, useMutation } from '@tanstack/react-query';
import {
  deleteWorkout,
  getWorkouts,
  getWorkoutSession,
  startWorkout,
  updateWorkout,
} from './workouts.api';

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
  return useMutation({
    meta: {
      error: { title: 'Could not start a workout' },
      invalidateQueryKey: workoutKeys.list,
    },
    mutationFn: (variables: { date: string }) => startWorkout({ data: variables }),
  });
}

export function useUpdateWorkoutMutation() {
  return useMutation({
    meta: {
      error: { title: 'Workout was not saved' },
      invalidateQueryKey: workoutKeys.all,
    },
    mutationFn: (variables: { id: string; name?: string; finished?: boolean }) =>
      updateWorkout({ data: variables }),
  });
}

export function useDeleteWorkoutMutation() {
  return useMutation({
    meta: {
      error: { title: 'Workout was not deleted' },
      invalidateQueryKey: workoutKeys.list,
      success: { title: 'Workout deleted' },
    },
    mutationFn: (variables: { id: string }) => deleteWorkout({ data: variables }),
  });
}
