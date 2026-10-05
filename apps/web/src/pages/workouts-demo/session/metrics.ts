import { formatDuration, type Measure, type MockSet } from '../mockData';

export type MetricKey = 'weightKg' | 'reps' | 'durationSeconds' | 'distanceKm';

export type MetricField = {
  key: MetricKey;
  label: string;
  unit: string;
  kind: 'number' | 'time';
};

const weight: MetricField = { key: 'weightKg', kind: 'number', label: 'Weight', unit: 'kg' };
const reps: MetricField = { key: 'reps', kind: 'number', label: 'Reps', unit: 'reps' };
const time: MetricField = { key: 'durationSeconds', kind: 'time', label: 'Time', unit: 'min:s' };
const distance: MetricField = { key: 'distanceKm', kind: 'number', label: 'Distance', unit: 'km' };

export const MEASURE_FIELDS: Record<Measure, MetricField[]> = {
  distance_duration: [distance, time],
  duration: [time],
  reps: [reps],
  weight_duration: [weight, time],
  weight_reps: [weight, reps],
};

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
  return Number.isFinite(value) ? value : null;
}

/** Completing a set with empty cells adopts last time's values (Strong's behaviour). */
export function completedPatch(set: MockSet, measure: Measure): Partial<MockSet> {
  const patch: Partial<MockSet> = { done: true };
  for (const field of MEASURE_FIELDS[measure]) {
    if (set[field.key] === null) patch[field.key] = set.previous?.[field.key] ?? null;
  }
  return patch;
}
