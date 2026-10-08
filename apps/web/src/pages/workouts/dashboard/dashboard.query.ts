import { queryOptions } from '@tanstack/react-query';
import { getWorkoutCalendar } from './dashboard.api';

export function workoutCalendarQueryOptions(since: string) {
  return queryOptions({
    queryFn: () => getWorkoutCalendar({ data: { since } }),
    queryKey: ['workouts', 'calendar', since],
  });
}
