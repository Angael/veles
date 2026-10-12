import { sql } from 'drizzle-orm';
import { workoutSets } from '@veles/db/schema';

/** Sum completed set durations in a query grouped by session; empty/non-timed sets add zero. */
export const completedSetDurationSql = sql<number>`coalesce(sum(${workoutSets.durationSeconds}) FILTER (WHERE ${workoutSets.completedAt} IS NOT NULL), 0)::float8`;
