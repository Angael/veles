import { queryOptions } from '@tanstack/react-query';
import { calendarRange } from './calendar/calendarDates';
import { getWorkoutCalendar } from './dashboard.api';

/** One month grid of workouts, keyed by the 1st of the month. */
export function workoutCalendarQueryOptions(month: string) {
  return queryOptions({
    queryFn: () => getWorkoutCalendar({ data: calendarRange(month) }),
    queryKey: ['workouts', 'calendar', month],
  });
}
