import { type } from 'arktype';
import { describe, expect, it } from 'vitest';
import { setNextSetsInputType } from '../workouts.validation';
import { fromNextSets, nextSetRows, nextSetsProblem, toNextSets } from './nextSets';

const exerciseId = '00000000-0000-4000-8000-000000000001';
const bench = [
  { weightKg: 60, reps: 10 },
  { weightKg: 60, reps: 10 },
  { weightKg: 60, reps: 8 },
];

describe('setNextSetsInputType', () => {
  const valid = (input: unknown) => !(setNextSetsInputType(input) instanceof type.errors);

  it('accepts ordered sets or an explicit null', () => {
    expect(valid({ exerciseId, sets: bench })).toBe(true);
    expect(valid({ exerciseId, sets: null })).toBe(true);
  });

  it('requires sets, so clearing is never a forgotten field', () => {
    expect(valid({ exerciseId })).toBe(false);
  });

  it('rejects empty, oversized, negative and fractional-rep prescriptions', () => {
    expect(valid({ exerciseId, sets: [] })).toBe(false);
    expect(valid({ exerciseId, sets: Array.from({ length: 21 }, () => ({ reps: 5 })) })).toBe(
      false,
    );
    expect(valid({ exerciseId, sets: [{ weightKg: -5, reps: 5 }] })).toBe(false);
    expect(valid({ exerciseId, sets: [{ reps: 5.5 }] })).toBe(false);
    expect(valid({ exerciseId: 'bench', sets: bench })).toBe(false);
  });
});

describe('nextSetsProblem', () => {
  it('accepts values the measure tracks', () => {
    expect(nextSetsProblem('weight_reps', bench)).toBeNull();
    expect(nextSetsProblem('weight_reps', [{ reps: 12 }])).toBeNull();
    expect(nextSetsProblem('distance_duration', [{ distanceKm: 5, durationSeconds: 1500 }])).toBe(
      null,
    );
  });

  it('names the set and the values the measure would hide', () => {
    expect(nextSetsProblem('duration', [{ durationSeconds: 60 }, { weightKg: 20 }])).toBe(
      'Set 2: weightKg is not tracked by measure duration; use durationSeconds.',
    );
  });

  it('rejects a set without any value', () => {
    expect(nextSetsProblem('reps', [{ reps: 10 }, { type: 'warmup', reps: null }])).toBe(
      'Set 2 needs a value: reps.',
    );
  });
});

describe('prescription conversion', () => {
  it('stores grams and meters in order and defaults the set type', () => {
    expect(
      toNextSets([{ type: 'warmup', weightKg: 40.25, reps: 12 }, { distanceKm: 1.5 }]),
    ).toEqual([
      {
        type: 'warmup',
        weightGrams: 40_250,
        reps: 12,
        durationSeconds: null,
        distanceMeters: null,
      },
      {
        type: 'normal',
        weightGrams: null,
        reps: null,
        durationSeconds: null,
        distanceMeters: 1500,
      },
    ]);
  });

  it('round-trips to display units for agents', () => {
    expect(fromNextSets(toNextSets(bench))).toEqual(
      bench.map((set) => ({ ...set, type: 'normal', durationSeconds: null, distanceKm: null })),
    );
  });
});

describe('nextSetRows', () => {
  it('builds unticked rows in prescription order', () => {
    const rows = nextSetRows('weight_reps', toNextSets(bench), 'slot-1');
    expect(rows.map((row) => [row.position, row.weightGrams, row.reps])).toEqual([
      [0, 60_000, 10],
      [1, 60_000, 10],
      [2, 60_000, 8],
    ]);
    expect(rows.every((row) => row.sessionExerciseId === 'slot-1')).toBe(true);
    expect(rows.every((row) => !('completedAt' in row))).toBe(true);
  });

  it('drops values the measure stopped tracking after the prescription was saved', () => {
    const [row] = nextSetRows('reps', toNextSets([{ weightKg: 60, reps: 10 }]), 'slot-1');
    expect(row).toMatchObject({ weightGrams: null, reps: 10 });
  });
});
