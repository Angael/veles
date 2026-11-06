import type { WorkoutNextSet } from '@veles/db/schema';
import { MEASURE_FIELDS, type Measure, type MetricKey, type SetMetrics } from '../metrics';
import type { setNextSetsInputType } from '../workouts.validation';

export type NextSetInput = NonNullable<(typeof setNextSetsInputType.infer)['sets']>[number];

const METRIC_KEYS: MetricKey[] = ['weightKg', 'reps', 'durationSeconds', 'distanceKm'];

const scaled = (value: number | null | undefined, factor: number) =>
  value === null || value === undefined ? null : Math.round(value * factor);

/**
 * Explains why a prescription does not fit the exercise, or returns null. Each set needs at least
 * one value the measure tracks and none it hides, so the agent learns about a mismatch instead of
 * the user getting rows with invisible numbers.
 */
export function nextSetsProblem(measure: Measure, sets: NextSetInput[]): string | null {
  const tracked = MEASURE_FIELDS[measure].map((field) => field.key);
  for (const [index, set] of sets.entries()) {
    const given = METRIC_KEYS.filter((key) => set[key] !== null && set[key] !== undefined);
    const hidden = given.filter((key) => !tracked.includes(key));
    if (hidden.length > 0) {
      return `Set ${index + 1}: ${hidden.join(', ')} is not tracked by measure ${measure}; use ${tracked.join(', ')}.`;
    }
    if (given.length === 0) return `Set ${index + 1} needs a value: ${tracked.join(' or ')}.`;
  }
  return null;
}

/** Agent input (kg, km) to stored units (grams, meters), keeping set order. */
export function toNextSets(sets: NextSetInput[]): WorkoutNextSet[] {
  return sets.map((set) => ({
    distanceMeters: scaled(set.distanceKm, 1_000),
    durationSeconds: scaled(set.durationSeconds, 1),
    reps: scaled(set.reps, 1),
    type: set.type ?? 'normal',
    weightGrams: scaled(set.weightKg, 1_000),
  }));
}

/** Stored prescription back in display units, for agents reading the exercise. */
export function fromNextSets(
  sets: WorkoutNextSet[],
): (SetMetrics & { type: WorkoutNextSet['type'] })[] {
  return sets.map((set) => ({
    distanceKm: set.distanceMeters === null ? null : set.distanceMeters / 1_000,
    durationSeconds: set.durationSeconds,
    reps: set.reps,
    type: set.type,
    weightKg: set.weightGrams === null ? null : set.weightGrams / 1_000,
  }));
}

/**
 * New, unticked set rows for a slot from a prescription. Values the exercise's current measure
 * no longer shows are dropped, in case the measure changed after the prescription was saved.
 */
export function nextSetRows(measure: Measure, sets: WorkoutNextSet[], sessionExerciseId: string) {
  const tracked = new Set(MEASURE_FIELDS[measure].map((field) => field.key));
  const keep = (key: MetricKey, value: number | null) => (tracked.has(key) ? value : null);
  return sets.map((set, position) => ({
    distanceMeters: keep('distanceKm', set.distanceMeters),
    durationSeconds: keep('durationSeconds', set.durationSeconds),
    position,
    reps: keep('reps', set.reps),
    sessionExerciseId,
    type: set.type,
    weightGrams: keep('weightKg', set.weightGrams),
  }));
}
