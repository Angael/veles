import { queryOptions } from '@tanstack/react-query';
import { workoutKeys } from '../workouts.query';
import { getWorkoutStats } from './stats.api';
import type { StatsPeriod } from './stats.server';

/** Training replay for a year or all time; lives under the workouts key, so edits refresh it. */
export function workoutStatsQueryOptions(period: StatsPeriod) {
  return queryOptions({
    queryFn: () => getWorkoutStats({ data: { period } }),
    queryKey: [...workoutKeys.all, 'stats', period],
  });
}
