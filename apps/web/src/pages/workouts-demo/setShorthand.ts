import { type } from 'arktype';
import { MEASURE_LABELS, type Measure, type SetType } from './mockData';

export type ParsedSet = {
  type: SetType;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceKm: number | null;
  rpe: number | null;
};

export type ShorthandResult = { sets: ParsedSet[]; errors: string[] };

export const SHORTHAND_EXAMPLES = [
  ['80x5', '1 set, 80 kg × 5'],
  ['80x5x3', '3 sets of 80 kg × 5'],
  ['x12x3', '3 sets of 12 reps, no weight'],
  ['w40x10', 'warm-up set'],
  ['80x5!', 'set to failure'],
  ['d60x8', 'drop set'],
  ['80x5 @8', 'RPE 8'],
  ['45s, 1:30, 2m', 'timed sets'],
  ['24kg 45s', 'weight + time'],
  ['5.2km 28:10', 'distance + time'],
  ['60x8, 70x6, 80x4x2', 'many groups, comma separated'],
] as const;

const number = String.raw`\d+(?:[.,]\d+)?`;
const weightReps = new RegExp(String.raw`^(${number})?x(\d+)(?:x(\d+))?$`);
const time = /^(?:(\d+):(\d{1,2})|(\d+(?:[.,]\d+)?)(s|m|min))$/;
const kg = new RegExp(String.raw`^(${number})kg$`);
const km = new RegExp(String.raw`^(${number})km$`);
const rpe = /^@(\d+(?:[.,]5)?)$/;

const toNumber = (value: string) => Number(value.replace(',', '.'));

export const SHORTHAND_HINTS: Record<Measure, string> = {
  distance_duration: '5.2km 28:10, 3km 18:00',
  duration: '45s, 1:30, 2m',
  reps: 'x12x3, x10',
  weight_duration: '24kg 45s, 20kg 1:30',
  weight_reps: '80x5x3, w40x10, x12',
};

const metricsType = type({
  distanceKm: 'number.safe >= 0 | null',
  durationSeconds: 'number.safe >= 0 | null',
  reps: '(number.safe & number.integer >= 0) | null',
  weightKg: 'number.safe >= 0 | null',
});

const measureTypes = {
  distance_duration: metricsType.merge({ reps: 'null', weightKg: 'null' }),
  duration: metricsType.merge({ distanceKm: 'null', reps: 'null', weightKg: 'null' }),
  reps: metricsType.merge({ distanceKm: 'null', durationSeconds: 'null', weightKg: 'null' }),
  weight_duration: metricsType.merge({ distanceKm: 'null', reps: 'null' }),
  weight_reps: metricsType.merge({ distanceKm: 'null', durationSeconds: 'null' }),
};

function parseTime(token: string) {
  const match = time.exec(token);
  if (!match) return null;
  if (match[1] !== undefined) return Number(match[1]) * 60 + Number(match[2]);
  const value = toNumber(match[3] ?? '0');
  return match[4] === 's' ? value : value * 60;
}

/**
 * Parses one comma-separated group such as `w40x10`, `80x5x3 @8` or `24kg 45s` into sets.
 * Tokens may come in any order; `x` repeats the set, prefixes `w`/`d` and suffix `!` set the type.
 */
function parseGroup(group: string): ParsedSet[] | string {
  let text = group.trim().toLowerCase().replaceAll('×', 'x').replaceAll('*', 'x');
  let setType: SetType = 'normal';
  if (/^w(?=[\d-x])/.test(text)) [setType, text] = ['warmup', text.slice(1)];
  else if (/^d(?=[\d-x])/.test(text)) [setType, text] = ['drop', text.slice(1)];
  if (text.endsWith('!')) [setType, text] = ['failure', text.slice(0, -1)];

  const set: ParsedSet = {
    distanceKm: null,
    durationSeconds: null,
    reps: null,
    rpe: null,
    type: setType,
    weightKg: null,
  };
  let count = 1;

  for (const token of text.split(/\s+/).filter(Boolean)) {
    const lifted = weightReps.exec(token);
    const seconds = parseTime(token);
    if (lifted) {
      set.weightKg = lifted[1] === undefined ? null : toNumber(lifted[1]);
      set.reps = Number(lifted[2]);
      count = lifted[3] === undefined ? 1 : Number(lifted[3]);
    } else if (seconds !== null) {
      set.durationSeconds = seconds;
    } else if (kg.test(token)) {
      set.weightKg = toNumber(kg.exec(token)?.[1] ?? '0');
    } else if (km.test(token)) {
      set.distanceKm = toNumber(km.exec(token)?.[1] ?? '0');
    } else if (rpe.test(token)) {
      set.rpe = toNumber(rpe.exec(token)?.[1] ?? '0');
    } else {
      return `Unknown "${token}"`;
    }
  }

  if (count < 1 || count > 20) return `"${group.trim()}": 1–20 sets`;
  if (!metricsType.allows(set)) return `"${group.trim()}": invalid values`;
  if (
    set.weightKg === null &&
    set.reps === null &&
    set.durationSeconds === null &&
    set.distanceKm === null
  ) {
    return `"${group.trim()}": add weight, reps, time or distance`;
  }
  return Array.from({ length: count }, () => ({ ...set }));
}

/**
 * Turns quick text like `60x8, 70x6, 80x4x2` into sets. Shared idea: the future MCP write tool
 * can accept the same text, so "log bench 80x5x3" means the same thing in the app and to an agent.
 */
export function parseSetShorthand(input: string, measure?: Measure): ShorthandResult {
  const result: ShorthandResult = { errors: [], sets: [] };
  for (const group of input.split(/[,;\n]/).filter((part) => part.trim())) {
    const parsed = parseGroup(group);
    if (typeof parsed === 'string') result.errors.push(parsed);
    else if (measure && parsed.some((set) => !measureTypes[measure].allows(set))) {
      result.errors.push(
        `"${group.trim()}" doesn't fit ${MEASURE_LABELS[measure].toLowerCase()}. Try ${SHORTHAND_HINTS[measure]}.`,
      );
    } else result.sets.push(...parsed);
  }
  return result;
}

/** Short label for a parsed or logged set, such as `80 × 5` or `5.2 km · 28:10`. */
export function describeSet(set: Omit<ParsedSet, 'rpe' | 'type'>) {
  const parts: string[] = [];
  if (set.weightKg !== null && set.reps !== null) parts.push(`${set.weightKg} × ${set.reps}`);
  else if (set.reps !== null) parts.push(`× ${set.reps}`);
  else if (set.weightKg !== null) parts.push(`${set.weightKg} kg`);
  if (set.distanceKm !== null) parts.push(`${set.distanceKm} km`);
  if (set.durationSeconds !== null) {
    const seconds = Math.round(set.durationSeconds);
    parts.push(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
  }
  return parts.join(' · ') || '—';
}
