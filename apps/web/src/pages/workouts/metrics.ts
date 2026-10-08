import type { exerciseMeasures, workoutSetTypes } from '@veles/db/schema';

export type Measure = (typeof exerciseMeasures)[number];
export type SetType = (typeof workoutSetTypes)[number];

export type MetricKey = 'weightKg' | 'reps' | 'durationSeconds' | 'distanceKm';
/** Set values in display units: kg, reps, seconds, km. */
export type SetMetrics = Record<MetricKey, number | null>;

export const MEASURES: Measure[] = [
  'weight_reps',
  'reps',
  'duration',
  'weight_duration',
  'distance_duration',
];

export const MEASURE_LABELS: Record<Measure, string> = {
  distance_duration: 'Distance + time',
  duration: 'Time',
  reps: 'Reps',
  weight_duration: 'Weight + time',
  weight_reps: 'Weight × reps',
};

export const SET_TYPES: SetType[] = ['normal', 'warmup', 'drop', 'failure'];

export const SET_TYPE_LABELS: Record<SetType, string> = {
  drop: 'Drop set',
  failure: 'To failure',
  normal: 'Normal',
  warmup: 'Warm-up',
};

export const SET_BADGE: Record<Exclude<SetType, 'normal'>, string> = {
  drop: 'D',
  failure: 'F',
  warmup: 'W',
};

export const EMPTY_METRICS: SetMetrics = {
  distanceKm: null,
  durationSeconds: null,
  reps: null,
  weightKg: null,
};

/**
 * Grey starting values when an exercise has no last time, so an empty row still reads as
 * "weight here, reps there". They are never saved unless the user picks them.
 */
export const DEFAULT_METRICS: Record<MetricKey, number> = {
  distanceKm: 5,
  durationSeconds: 60,
  reps: 12,
  weightKg: 40,
};

export type MetricField = {
  key: MetricKey;
  label: string;
  unit: string;
  /** Unit shown inside a compact cell; time needs none because `1:30` is clear. */
  cellUnit?: string;
  kind: 'number' | 'time';
};

const weight: MetricField = {
  cellUnit: 'kg',
  key: 'weightKg',
  kind: 'number',
  label: 'Weight',
  unit: 'kg',
};
const reps: MetricField = {
  cellUnit: 'reps',
  key: 'reps',
  kind: 'number',
  label: 'Reps',
  unit: 'reps',
};
const time: MetricField = { key: 'durationSeconds', kind: 'time', label: 'Time', unit: 'min:s' };
const distance: MetricField = {
  cellUnit: 'km',
  key: 'distanceKm',
  kind: 'number',
  label: 'Distance',
  unit: 'km',
};

export const MEASURE_FIELDS: Record<Measure, MetricField[]> = {
  distance_duration: [distance, time],
  duration: [time],
  reps: [reps],
  weight_duration: [weight, time],
  weight_reps: [weight, reps],
};

export function formatDuration(totalSeconds: number) {
  const sign = totalSeconds < 0 ? '-' : '';
  const seconds = Math.abs(Math.round(totalSeconds));
  return `${sign}${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Drag speed (px/ms) where each bigger step kicks in. */
const tiers = (...steps: number[]) =>
  steps.map((step, index) => ({ from: [0, 0.3, 0.65, 1.1][index] ?? 2, step }));

/**
 * Drag tuning per metric: slow drags use the smallest step, faster drags the bigger ones, so the
 * user never picks a step. Weight goes 0.5 → 1 → 2.5 → 5.
 */
export function scrubTuning(field: MetricField) {
  switch (field.key) {
    case 'weightKg':
      return { max: 500, tiers: tiers(0.5, 1, 2.5, 5) };
    case 'reps':
      return { max: 200, pixelsPerStep: 16, tiers: tiers(1, 1, 2, 5) };
    case 'durationSeconds':
      return { max: 6 * 3600, tiers: tiers(5, 15, 30, 60) };
    case 'distanceKm':
      return { max: 300, tiers: tiers(0.1, 0.5, 1, 5) };
  }
}

export function formatMetric(field: MetricField, value: number) {
  return field.kind === 'time' ? formatDuration(value) : String(Number(value.toFixed(2)));
}

/** Accepts `90`, `1:30` or `1.5m` for time; plain decimals with `,` or `.` for numbers. */
export function parseMetric(field: MetricField, text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (!trimmed) return null;
  if (field.kind === 'time') {
    const clock = /^(\d+):(\d{1,2})$/.exec(trimmed);
    if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
    const minutes = /^(\d+(?:\.\d+)?)m$/.exec(trimmed);
    if (minutes) return Math.round(Number(minutes[1]) * 60);
  }
  const value = Number(trimmed.replace(/s$/, ''));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Completing a set with empty cells adopts last time's values (Strong's behaviour). Returns null
 * when a cell is empty and there is no last time to copy, so the caller can ask instead.
 */
export function filledFromPrevious(
  set: SetMetrics & { previous: SetMetrics | null },
  measure: Measure,
): Partial<SetMetrics> | null {
  const patch: Partial<SetMetrics> = {};
  for (const field of MEASURE_FIELDS[measure]) {
    if (set[field.key] !== null) continue;
    const previous = set.previous?.[field.key] ?? null;
    if (previous === null) return null;
    patch[field.key] = previous;
  }
  return patch;
}

/** Short label for a logged set, such as `80 × 5` or `5.2 km · 28:10`. */
export function describeSet(set: SetMetrics) {
  const parts: string[] = [];
  if (set.weightKg !== null && set.reps !== null) parts.push(`${set.weightKg} × ${set.reps}`);
  else if (set.reps !== null) parts.push(`× ${set.reps}`);
  else if (set.weightKg !== null) parts.push(`${set.weightKg} kg`);
  if (set.distanceKm !== null) parts.push(`${set.distanceKm} km`);
  if (set.durationSeconds !== null) parts.push(formatDuration(set.durationSeconds));
  return parts.join(' · ') || '—';
}

/** Working-set number per row; warm-ups and drops don't count, like Strong and Hevy. */
export function workingSetNumbers(sets: { type: SetType }[]) {
  let count = 0;
  return sets.map((set) => (set.type === 'normal' ? ++count : count));
}
