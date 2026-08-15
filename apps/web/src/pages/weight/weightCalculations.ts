import { formatISO, parseISO, subDays, subMonths } from 'date-fns';
import type { WeightChartRange } from './weightChartRange';
import type { WeightEntry } from './weight.api';

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

/** Calculates change from an interpolated weight on the requested day. */
export function getChangeFromDaysAgo(entries: WeightEntry[], days: number) {
  const latestEntry = entries.at(-1);

  if (!latestEntry) {
    return undefined;
  }

  const targetDate = formatISO(subDays(parseISO(latestEntry.date), days), {
    representation: 'date',
  });
  const previousWeight = getWeightAtDate(entries, targetDate);

  return previousWeight === undefined
    ? undefined
    : Math.round((latestEntry.weightKg - previousWeight) * 10) / 10;
}
