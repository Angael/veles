import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeDb } from '../fakeDb.testing';

vi.mock('@/server/db.server', async () => ({
  db: (await import('../fakeDb.testing')).fakeDb.db,
}));

vi.mock('@/lib/i18n/getLocale', () => ({
  getLocale: () => 'en',
  translate: (text: { en: string }) => text.en,
}));

const openWorkout = vi.hoisted(() => ({
  date: '2026-10-22',
  endedAt: null as Date | null,
  id: '00000000-0000-4000-8000-0000000000aa',
  name: 'Push',
}));

vi.mock('../workouts.server', () => ({
  autoFinishIdleWorkouts: vi.fn(),
  nextPosition: () => 0,
  previousSetCount: vi.fn(async () => 2),
  requireNoOpenWorkout: vi.fn(),
  requireOwnedWorkout: vi.fn(async () => openWorkout),
  resolveExerciseId: vi.fn(async (_tx: unknown, _userId: string, ref: { exerciseId: string }) => {
    return ref.exerciseId;
  }),
  touchWorkout: vi.fn(),
}));

import { startRoutineRecord } from '../routines/routines.server';
import { addWorkoutExerciseRecord } from '../session/session.server';
import { setNextSetsRecord } from './nextSets.server';
import { toNextSets } from './nextSets';

const userId = 'user-1';
const exerciseId = '00000000-0000-4000-8000-000000000001';
const otherExerciseId = '00000000-0000-4000-8000-000000000002';
const prescription = toNextSets([
  { weightKg: 60, reps: 10 },
  { weightKg: 60, reps: 10 },
  { weightKg: 60, reps: 8 },
]);

const ofOp = (op: string, table: string) =>
  fakeDb.calls.filter((call) => call.op === op && call.table === table);
const setRows = () => ofOp('insert', 'workout_set')[0]?.values;

beforeEach(() => {
  fakeDb.reset();
  openWorkout.endedAt = null;
});

describe('setNextSetsRecord', () => {
  it('saves the prescription only on the exercise the user owns', async () => {
    fakeDb.selects.push([{ measure: 'weight_reps' }]);
    const result = await setNextSetsRecord(userId, {
      exerciseId,
      sets: [{ weightKg: 60, reps: 10 }],
    });

    const [lookup, save] = fakeDb.calls;
    expect(lookup?.where?.params).toEqual([exerciseId, userId]);
    expect(save).toMatchObject({ op: 'update', table: 'workout_exercise' });
    expect(save?.where?.params).toEqual([exerciseId, userId]);
    expect(save?.set).toEqual({ nextSets: prescription.slice(0, 1) });
    expect(result.nextSets).toEqual([
      { type: 'normal', weightKg: 60, reps: 10, durationSeconds: null, distanceKm: null },
    ]);
  });

  it('clears with null, which is a safe no-op when nothing is pending', async () => {
    fakeDb.selects.push([{ measure: 'weight_reps' }]);
    await setNextSetsRecord(userId, { exerciseId, sets: null });
    expect(ofOp('update', 'workout_exercise')[0]?.set).toEqual({ nextSets: null });
  });

  it("refuses another user's exercise without writing", async () => {
    await expect(setNextSetsRecord(userId, { exerciseId, sets: null })).rejects.toThrow(
      'Exercise not found.',
    );
    expect(ofOp('update', 'workout_exercise')).toHaveLength(0);
  });

  it('refuses values the measure does not track without writing', async () => {
    fakeDb.selects.push([{ measure: 'duration' }]);
    await expect(
      setNextSetsRecord(userId, { exerciseId, sets: [{ weightKg: 60, reps: 10 }] }),
    ).rejects.toThrow('not tracked by measure duration');
    expect(ofOp('update', 'workout_exercise')).toHaveLength(0);
  });
});

describe('addWorkoutExerciseRecord with a prescription', () => {
  it('prefills the prescribed sets in order, unticked, and uses the prescription up', async () => {
    fakeDb.selects.push(
      [{ max: null }],
      [{ id: exerciseId, measure: 'weight_reps', nextSets: prescription }],
    );
    fakeDb.inserts.push([{ id: 'slot-1' }]);
    await addWorkoutExerciseRecord(userId, { exerciseId, workoutId: openWorkout.id });

    const take = fakeDb.calls.find((call) => call.lock);
    expect(take?.lock).toBe('update');
    expect(take?.where?.params).toEqual([userId, exerciseId]);
    const [clear] = ofOp('update', 'workout_exercise');
    expect(clear?.set).toEqual({ nextSets: null });
    expect(clear?.where?.params).toEqual([userId, exerciseId]);
    expect(setRows()).toEqual([
      expect.objectContaining({ position: 0, weightGrams: 60_000, reps: 10 }),
      expect.objectContaining({ position: 1, weightGrams: 60_000, reps: 10 }),
      expect.objectContaining({ position: 2, weightGrams: 60_000, reps: 8 }),
    ]);
    expect(JSON.stringify(setRows())).not.toContain('completedAt');
  });

  it('keeps empty rows from last time when nothing is pending', async () => {
    fakeDb.selects.push([{ max: null }], []);
    fakeDb.inserts.push([{ id: 'slot-1' }]);
    await addWorkoutExerciseRecord(userId, { exerciseId, workoutId: openWorkout.id });

    expect(ofOp('update', 'workout_exercise')).toHaveLength(0);
    expect(setRows()).toEqual([
      { position: 0, sessionExerciseId: 'slot-1' },
      { position: 1, sessionExerciseId: 'slot-1' },
    ]);
  });

  it('leaves the prescription pending when backfilling a finished workout', async () => {
    openWorkout.endedAt = new Date('2026-10-20T10:00:00Z');
    fakeDb.selects.push([{ max: null }]);
    fakeDb.inserts.push([{ id: 'slot-1' }]);
    await addWorkoutExerciseRecord(userId, { exerciseId, workoutId: openWorkout.id });

    expect(fakeDb.calls.some((call) => call.lock === 'update')).toBe(false);
    expect(ofOp('update', 'workout_exercise')).toHaveLength(0);
    expect(setRows()).toHaveLength(2);
  });
});

describe('startRoutineRecord with a prescription', () => {
  it('uses the prescription for the first slot of that exercise only', async () => {
    fakeDb.selects.push(
      [{ id: 'routine-1', name: 'Push' }],
      [
        { exerciseId, setTypes: ['warmup', 'normal'] },
        { exerciseId: otherExerciseId, setTypes: ['normal'] },
        { exerciseId, setTypes: ['drop'] },
      ],
      [{ id: exerciseId, measure: 'weight_reps', nextSets: prescription.slice(0, 1) }],
    );
    fakeDb.inserts.push(
      [{ id: 'workout-1' }],
      [
        { id: 'slot-a', position: 0 },
        { id: 'slot-b', position: 1 },
        { id: 'slot-c', position: 2 },
      ],
    );
    await startRoutineRecord(userId, { date: '2026-10-22', routineId: 'routine-1' });

    expect(fakeDb.calls.find((call) => call.lock === 'update')?.where?.params).toEqual([
      userId,
      exerciseId,
      otherExerciseId,
    ]);
    expect(setRows()).toEqual([
      expect.objectContaining({ position: 0, sessionExerciseId: 'slot-a', weightGrams: 60_000 }),
      { position: 0, sessionExerciseId: 'slot-b', type: 'normal' },
      { position: 0, sessionExerciseId: 'slot-c', type: 'drop' },
    ]);
  });
});
