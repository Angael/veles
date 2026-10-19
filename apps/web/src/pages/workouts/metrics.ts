import type { exerciseMeasures, workoutSetTypes } from '@veles/db/schema';
import type { Locale, Localized } from '@/lib/i18n/locale';

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

export const MEASURE_LABELS: Record<Measure, Localized> = {
  distance_duration: { en: 'Distance + time', pl: 'Dystans + czas' },
  duration: { en: 'Time', pl: 'Czas' },
  reps: { en: 'Reps', pl: 'Powtórzenia' },
  weight_duration: { en: 'Weight + time', pl: 'Ciężar + czas' },
  weight_reps: { en: 'Weight × reps', pl: 'Ciężar × powtórzenia' },
};

export const SET_TYPES: SetType[] = ['normal', 'warmup', 'drop', 'failure'];

export const SET_TYPE_LABELS: Record<SetType, Localized> = {
  drop: { en: 'Drop set', pl: 'Drop set' },
  failure: { en: 'To failure', pl: 'Do upadku' },
  normal: { en: 'Normal', pl: 'Zwykła' },
  warmup: { en: 'Warm-up', pl: 'Rozgrzewka' },
};

/** Short note on how each set type counts, flashed next to the badge after a tap. */
export const SET_TYPE_NOTES: Record<SetType, Localized> = {
  drop: { en: 'lighter, no rest', pl: 'lżej, bez przerwy' },
  failure: { en: 'until you can’t', pl: 'aż nie dasz rady' },
  normal: { en: 'counted', pl: 'liczona' },
  warmup: { en: 'not counted', pl: 'nieliczona' },
};

export const SET_BADGE: Record<Exclude<SetType, 'normal'>, Localized> = {
  drop: { en: 'D', pl: 'D' },
  failure: { en: 'F', pl: 'U' },
  warmup: { en: 'W', pl: 'R' },
};

/** Short weekday with day and month, e.g. `Mon 06.10`, for workout and routine dates. */
export const SHORT_DAY: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  weekday: 'short',
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

/** Heaviest weight a set can log; anything above is a typo. */
export const MAX_WEIGHT_KG = 200;

export type MetricField = {
  key: MetricKey;
  label: Localized;
  unit: Localized;
  /** Unit shown inside a compact cell; time needs none because `1:30` is clear. */
  cellUnit?: Localized;
  kind: 'number' | 'time';
};

const kg = { en: 'kg', pl: 'kg' };
const km = { en: 'km', pl: 'km' };
const repsUnit = { en: 'reps', pl: 'powt.' };
const weight: MetricField = {
  cellUnit: kg,
  key: 'weightKg',
  kind: 'number',
  label: { en: 'Weight', pl: 'Ciężar' },
  unit: kg,
};
const reps: MetricField = {
  cellUnit: repsUnit,
  key: 'reps',
  kind: 'number',
  label: { en: 'Reps', pl: 'Powtórzenia' },
  unit: repsUnit,
};
const time: MetricField = {
  key: 'durationSeconds',
  kind: 'time',
  label: { en: 'Time', pl: 'Czas' },
  unit: { en: 'min:s', pl: 'min:s' },
};
const distance: MetricField = {
  cellUnit: km,
  key: 'distanceKm',
  kind: 'number',
  label: { en: 'Distance', pl: 'Dystans' },
  unit: km,
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

/** Floors elapsed seconds at the time entered on sets, so a short or missing timer never hides logged work. */
export function floorDuration(elapsed: number | null, setSeconds: number) {
  return elapsed === null && setSeconds === 0 ? null : Math.max(0, elapsed ?? 0, setSeconds);
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
      return { max: MAX_WEIGHT_KG, tiers: tiers(0.5, 1, 2.5, 5) };
    case 'reps':
      return { max: 200, pixelsPerStep: 16, tiers: tiers(1, 1, 2, 5) };
    case 'durationSeconds':
      return { max: 6 * 3600, tiers: tiers(5, 15, 30, 60) };
    case 'distanceKm':
      return { max: 300, tiers: tiers(0.1, 0.5, 1, 5) };
  }
}

/** Plain set number, e.g. `82.5` or `82,5`; no grouping so it stays easy to edit. */
export function formatSetNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(
    value,
  );
}

export function formatMetric(field: MetricField, value: number, locale: Locale) {
  return field.kind === 'time' ? formatDuration(value) : formatSetNumber(value, locale);
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
export function describeSet(set: SetMetrics, locale: Locale) {
  const num = (value: number) => formatSetNumber(value, locale);
  const parts: string[] = [];
  if (set.weightKg !== null && set.reps !== null) {
    parts.push(`${num(set.weightKg)} × ${set.reps}`);
  } else if (set.reps !== null) parts.push(`× ${set.reps}`);
  else if (set.weightKg !== null) parts.push(`${num(set.weightKg)} kg`);
  if (set.distanceKm !== null) parts.push(`${num(set.distanceKm)} km`);
  if (set.durationSeconds !== null) parts.push(formatDuration(set.durationSeconds));
  return parts.join(' · ') || '—';
}

/** Working-set number per row; warm-ups and drops don't count, like Strong and Hevy. */
export function workingSetNumbers(sets: { type: SetType }[]) {
  let count = 0;
  return sets.map((set) => (set.type === 'normal' ? ++count : count));
}
