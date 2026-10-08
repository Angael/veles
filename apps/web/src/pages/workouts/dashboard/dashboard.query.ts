import { queryOptions } from '@tanstack/react-query';
import { getExerciseProgress, getWorkoutCalendar } from './dashboard.api';

export function workoutCalendarQueryOptions(since: string) {
  return queryOptions({
    queryFn: () => getWorkoutCalendar({ data: { since } }),
    queryKey: ['workouts', 'calendar', since],
  });
}

export function exerciseProgressQueryOptions() {
  return queryOptions({
    queryFn: () => getExerciseProgress(),
    queryKey: ['workouts', 'exercise-progress'],
  });
}
