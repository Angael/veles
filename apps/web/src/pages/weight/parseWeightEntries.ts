import type { WeightEntry } from './weight.api';

/** Parses the documented line format and keeps the last value for duplicate dates. */
export function parseWeightEntries(value: string): { entries: WeightEntry[]; errors: string[] } {
  const entriesByDate = new Map<string, WeightEntry>();
  const errors: string[] = [];

  for (const [index, rawLine] of value.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = /^(\d{4}-\d{2}-\d{2})\s+(\d+(?:[.,]\d+)?)\s*kg$/i.exec(line);
    const date = match?.[1];
    const weightKg = match?.[2] ? Number(match[2].replace(',', '.')) : Number.NaN;

    if (!date || !isIsoDate(date) || weightKg < 30 || weightKg > 300) {
      errors.push(`Line ${index + 1} is invalid.`);
      continue;
    }
    entriesByDate.set(date, { date, weightKg });
  }

  return {
    entries: [...entriesByDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
    errors,
  };
}

function isIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
