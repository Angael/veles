import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';

const mocks = vi.hoisted(() => ({ select: vi.fn(), autoFinish: vi.fn() }));

// Exercise the read handlers without a database or authentication environment.
vi.mock('@tanstack/react-start', () => {
  const builder = () => ({
    middleware: () => builder(),
    validator: () => builder(),
    handler: <T>(handler: T) => handler,
  });
  return { createServerFn: builder };
});
vi.mock('@/server/db.server', () => ({ db: { select: mocks.select } }));
vi.mock('@/server/getSession.server', () => ({
  requireSession: async () => ({ user: { id: 'owner' } }),
}));
vi.mock('@/server/middleware/logMiddleware', () => ({ logMiddleware: vi.fn() }));
vi.mock('./workouts.server', () => ({
  autoFinishIdleWorkouts: mocks.autoFinish,
  loadWorkoutSession: vi.fn(),
  requireNoOpenWorkout: vi.fn(),
  requireOwnedWorkout: vi.fn(),
}));

import { getWorkouts } from './workouts.api';
import { getWorkoutCalendar } from './dashboard/dashboard.api';
import { completedSetDurationSql } from './duration.server';

const row = {
  completedSeconds: 2100,
  date: '2026-10-12',
  doneSets: 4,
  endedAt: new Date('2026-10-12T10:00:10Z'),
  exerciseCount: 3,
  id: 'workout',
  lastSetAt: new Date('2026-10-12T10:00:05Z'),
  name: 'Logged afterwards',
  startedAt: new Date('2026-10-12T10:00:00Z'),
  volumeGrams: 1000,
};

function mockRows(rows: (typeof row | (Omit<typeof row, 'endedAt'> & { endedAt: null }))[]) {
  const query = Object.assign(Promise.resolve(rows), {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
  });
  mocks.select.mockReturnValue(query);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRows([row]);
});

describe('persisted workout duration reads', () => {
  it('returns the completed-set floor on every history reload without rewriting timestamps', async () => {
    for (let reload = 0; reload < 2; reload += 1) {
      const [workout] = await getWorkouts();
      expect(workout?.durationSeconds).toBe(2100);
      expect(workout?.startedAt).toBe(row.startedAt.toISOString());
      expect(workout?.endedAt).toBe(row.endedAt.toISOString());
    }
    expect(mocks.select).toHaveBeenCalledWith(
      expect.objectContaining({ completedSeconds: completedSetDurationSql }),
    );
  });

  it('applies the same floor to calendar totals and adds multiple workouts for the same day', async () => {
    mockRows([row, { ...row, id: 'second', completedSeconds: 600 }]);
    const days = await getWorkoutCalendar({ data: { since: row.date } });
    expect(days).toEqual([{ date: row.date, seconds: 2700, workoutCount: 2, workoutId: row.id }]);
    expect(mocks.select).toHaveBeenCalledWith(
      expect.objectContaining({ completedSeconds: completedSetDurationSql }),
    );
  });

  it('preserves longer elapsed durations in history and calendar', async () => {
    mockRows([{ ...row, endedAt: new Date('2026-10-12T11:00:00Z') }]);
    expect((await getWorkouts())[0]?.durationSeconds).toBe(3600);
    expect((await getWorkoutCalendar({ data: { since: row.date } }))[0]?.seconds).toBe(3600);
  });

  it('keeps non-timed session durations unchanged in history and calendar', async () => {
    mockRows([{ ...row, completedSeconds: 0 }]);
    expect((await getWorkouts())[0]?.durationSeconds).toBe(10);
    expect((await getWorkoutCalendar({ data: { since: row.date } }))[0]?.seconds).toBe(10);
  });

  it('handles auto-finished sessions using the stored last-edit end time', async () => {
    mockRows([{ ...row, endedAt: row.lastSetAt }]);
    expect((await getWorkouts())[0]?.durationSeconds).toBe(2100);
    expect(mocks.autoFinish).toHaveBeenCalledWith(expect.anything(), 'owner');
  });

  it('does not count idle wall-clock time for open sessions in the calendar', async () => {
    mockRows([{ ...row, endedAt: null }]);
    expect((await getWorkouts())[0]?.durationSeconds).toBeNull();
    expect((await getWorkoutCalendar({ data: { since: row.date } }))[0]?.seconds).toBe(2100);
  });

  it('aggregates only completed persisted durations, with zero for empty/non-timed sets', () => {
    const query = new PgDialect().sqlToQuery(completedSetDurationSql);
    expect(query.sql).toBe(
      'coalesce(sum("workout_set"."duration_seconds") FILTER (WHERE "workout_set"."completed_at" IS NOT NULL), 0)::float8',
    );
    expect(query.params).toEqual([]);
  });
});
