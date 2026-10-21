import { getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { workoutSessions } from '@veles/db/schema';

/** Every write the fake db receives, so tests can prove a move touches only the session row. */
const writes: { op: string; table: string; values?: Record<string, unknown> }[] = [];

vi.mock('@/server/db.server', () => {
  const record = (op: string) => (table: PgTable) => {
    const write: (typeof writes)[number] = { op, table: getTableName(table) };
    writes.push(write);
    const chain = {
      set: (values: Record<string, unknown>) => {
        write.values = values;
        return chain;
      },
      values: () => chain,
      where: async () => {},
    };
    return chain;
  };
  return { db: { delete: record('delete'), insert: record('insert'), update: record('update') } };
});

vi.mock('../workouts.server', () => ({
  autoFinishIdleWorkouts: vi.fn(),
  completeFilledSets: vi.fn(),
  defaultWorkoutName: (date: string) => `${date} workout`,
  requireNoOpenWorkout: vi.fn(),
  requireOwnedWorkout: vi.fn(async () => ({
    date: '2026-10-20',
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Leg day',
  })),
}));

import { updateWorkoutRecord } from './session.server';

const id = '00000000-0000-4000-8000-000000000001';

describe('updateWorkoutRecord moving a session', () => {
  beforeEach(() => {
    writes.length = 0;
  });

  it('updates the existing session date and leaves exercises, sets and notes untouched', async () => {
    await updateWorkoutRecord('user-1', { date: '2026-10-18', id });

    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      op: 'update',
      table: getTableName(workoutSessions),
      values: { date: '2026-10-18' },
    });
    expect(writes[0]?.values).not.toHaveProperty('name');
    expect(writes[0]?.values).not.toHaveProperty('endedAt');
  });

  it('keeps the date when the picked day is the current day', async () => {
    await updateWorkoutRecord('user-1', { date: '2026-10-20', id });

    expect(writes).toHaveLength(1);
    expect(writes[0]?.values).not.toHaveProperty('date');
  });
});
