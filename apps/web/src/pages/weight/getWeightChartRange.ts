export type WeightChartEntry = {
  date: string;
  weightKg: number;
};

export type WeightChartRange = '1m' | '3m' | '6m' | '1y' | 'all';

const RANGE_MONTHS: Partial<Record<WeightChartRange, number>> = {
  '1m': 1,
  '3m': 3,
  '6m': 6,
  '1y': 12,
};

/** Returns entries in the selected window, adding an interpolated value at its cutoff when possible. */
export function getWeightChartRange(entries: WeightChartEntry[], range: WeightChartRange) {
  const latestEntry = entries.at(-1);
  const months = RANGE_MONTHS[range];

  if (!latestEntry || months === undefined) {
    return entries;
  }

  const cutoff = subtractUtcMonths(latestEntry.date, months);
  const firstVisibleIndex = entries.findIndex((entry) => entry.date >= cutoff);

  if (firstVisibleIndex <= 0) {
    return firstVisibleIndex === -1 ? [] : entries.slice(firstVisibleIndex);
  }

  const beforeCutoff = entries[firstVisibleIndex - 1];
  const afterCutoff = entries[firstVisibleIndex];

  if (!beforeCutoff || !afterCutoff) {
    return entries.slice(Math.max(firstVisibleIndex, 0));
  }

  const beforeTime = toUtcTime(beforeCutoff.date);
  const afterTime = toUtcTime(afterCutoff.date);
  const cutoffTime = toUtcTime(cutoff);
  const progress = (cutoffTime - beforeTime) / (afterTime - beforeTime);
  const weightKg =
    beforeCutoff.weightKg + (afterCutoff.weightKg - beforeCutoff.weightKg) * progress;

  return [{ date: cutoff, weightKg }, ...entries.slice(firstVisibleIndex)];
}

function subtractUtcMonths(value: string, months: number) {
  const date = new Date(`${value}T00:00:00Z`);
  const originalDay = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - months);
  const lastDayOfMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  date.setUTCDate(Math.min(originalDay, lastDayOfMonth));
  return date.toISOString().slice(0, 10);
}

function toUtcTime(value: string) {
  return new Date(`${value}T00:00:00Z`).valueOf();
}
