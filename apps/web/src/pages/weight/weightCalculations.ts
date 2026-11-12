import { formatISO, parseISO, subMonths } from 'date-fns';
import type { WeightEntry } from './weight.api';
export const WEIGHT_CHART_RANGE_COOKIE = 'weight-chart-range';
export const DEFAULT_WEIGHT_CHART_RANGE = '1m' as const;

export const WEIGHT_CHART_RANGES = ['1m', '3m', '6m', '1y', '2y', '3y', 'all'] as const;

export type WeightChartRange = (typeof WEIGHT_CHART_RANGES)[number];

export const WEIGHT_CHART_RANGE_MONTHS: Partial<Record<WeightChartRange, number>> = {
  '1m': 1,
  '3m': 3,
  '6m': 6,
  '1y': 12,
  '2y': 24,
  '3y': 36,
};

/** Returns entries in the selected window, adding an interpolated value at its cutoff when possible. */
export function getWeightChartRange(entries: WeightEntry[], range: WeightChartRange) {
  const latestEntry = entries.at(-1);
  const months = WEIGHT_CHART_RANGE_MONTHS[range];

  if (!latestEntry || months === undefined) {
    return entries;
  }

  const cutoff = formatISO(subMonths(parseISO(latestEntry.date), months), {
    representation: 'date',
  });
  const firstVisibleIndex = entries.findIndex((entry) => entry.date >= cutoff);

  if (firstVisibleIndex <= 0) {
    return firstVisibleIndex === -1 ? [] : entries.slice(firstVisibleIndex);
  }

  const weightKg = getWeightAtDate(entries, cutoff);

  if (weightKg === undefined) {
    return entries.slice(firstVisibleIndex);
  }

  return [{ date: cutoff, weightKg }, ...entries.slice(firstVisibleIndex)];
}

/** Returns the measured or linearly interpolated weight for a date inside the known range. */
export function getWeightAtDate(entries: WeightEntry[], date: string) {
  const afterIndex = entries.findIndex((entry) => entry.date >= date);
  const after = entries[afterIndex];

  if (!after || after.date === date) {
    return after?.weightKg;
  }

  const before = entries[afterIndex - 1];

  if (!before) {
    return undefined;
  }

  const beforeTime = parseISO(before.date).getTime();
  const afterTime = parseISO(after.date).getTime();
  const progress = (parseISO(date).getTime() - beforeTime) / (afterTime - beforeTime);

  return before.weightKg + (after.weightKg - before.weightKg) * progress;
}

/** Days over which the smoothed trend forgets roughly two thirds of older readings. */
const TREND_TIME_CONSTANT_DAYS = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1_000;

/**
 * Smooths daily water and food swings with a time-weighted moving average, so the chart shows the
 * real direction instead of noise. Gaps between entries weigh the new reading more.
 */
export function getWeightTrend(entries: WeightEntry[]): WeightEntry[] {
  let trendKg: number | undefined;
  let previousTime = 0;

  return entries.map((entry) => {
    const time = parseISO(entry.date).getTime();

    if (trendKg === undefined) {
      trendKg = entry.weightKg;
    } else {
      const days = (time - previousTime) / DAY_IN_MS;
      const weight = 1 - Math.exp(-days / TREND_TIME_CONSTANT_DAYS);
      trendKg += (entry.weightKg - trendKg) * weight;
    }

    previousTime = time;

    return { date: entry.date, weightKg: trendKg };
  });
}

/** Change from the first to the last visible weight, plus the matching pace per week. */
export function getRangeChange(visibleEntries: WeightEntry[]) {
  const first = visibleEntries.at(0);
  const last = visibleEntries.at(-1);

  if (!first || !last || first.date === last.date) {
    return undefined;
  }

  const days = (parseISO(last.date).getTime() - parseISO(first.date).getTime()) / DAY_IN_MS;
  const changeKg = last.weightKg - first.weightKg;

  return {
    changeKg: Math.round(changeKg * 10) / 10,
    perWeekKg: Math.round((changeKg / days) * 7 * 10) / 10,
  };
}

/** Direction label for styling a weight change; losing is styled as progress. */
export function getChangeDirection(changeKg: number | undefined) {
  if (changeKg === undefined || changeKg === 0) {
    return 'flat';
  }

  return changeKg < 0 ? 'down' : 'up';
}
