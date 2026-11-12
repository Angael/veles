import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import {
  computeWorkoutStats,
  type StatsPeriod,
  type WorkoutStats,
} from '@/pages/workouts/stats/stats.server';
import type { ReadPage, ReadQuery } from './mcp-read-helpers.server';

function parsePeriod(id: string): StatsPeriod {
  if (id === 'all') return 'all';
  if (/^\d{4}$/.test(id)) return Number(id);
  throw new ClientSafeError('Expected "all" or a four-digit year.');
}

/** Drops browser-only start times and the picker's year list; the period becomes the id. */
const toAgentStats = ({
  startedAt: _startedAt,
  years: _years,
  period,
  ...stats
}: WorkoutStats) => ({
  id: String(period),
  ...stats,
});

/**
 * Training replay per period: all time first, then each year with workouts, newest first.
 * `query.id` selects one period ("all" or "2026").
 */
export async function readWorkoutStats(userId: string, query: ReadQuery): Promise<ReadPage> {
  const periods: StatsPeriod[] = query.id
    ? [parsePeriod(query.id)]
    : ['all', ...(await computeWorkoutStats(userId, 'all')).years];
  const items = await Promise.all(
    periods
      .slice(0, query.limit)
      .map(async (period) => toAgentStats(await computeWorkoutStats(userId, period))),
  );
  return { items, nextCursor: null };
}
