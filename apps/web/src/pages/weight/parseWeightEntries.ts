import { dateOnlyType } from '@/lib/dateOnly';
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

    if (!date || !dateOnlyType.allows(date) || weightKg < 30 || weightKg > 300) {
      errors.push(`Line ${index + 1} is invalid.`);
      continue;
    }
    entriesByDate.set(date, { date, weightKg });
  }

  return {
    entries: [...entriesByDate.values()].toSorted((a, b) => a.date.localeCompare(b.date)),
    errors,
  };
}
