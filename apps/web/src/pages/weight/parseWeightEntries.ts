import { dateOnlyType } from '@/lib/dateOnly';
import type { WeightEntry } from './weight.api';

/**
 * Parses the documented line format and keeps the last value for duplicate dates. Reports invalid
 * lines by their 1-based number, so the page can word the error in the user's language.
 */
export function parseWeightEntries(value: string): {
  entries: WeightEntry[];
  invalidLines: number[];
} {
  const entriesByDate = new Map<string, WeightEntry>();
  const invalidLines: number[] = [];

  for (const [index, rawLine] of value.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = /^(\d{4}-\d{2}-\d{2})\s+(\d+(?:[.,]\d+)?)\s*kg$/i.exec(line);
    const date = match?.[1];
    const weightKg = match?.[2] ? Number(match[2].replace(',', '.')) : Number.NaN;

    if (!date || !dateOnlyType.allows(date) || weightKg < 30 || weightKg > 300) {
      invalidLines.push(index + 1);
      continue;
    }
    entriesByDate.set(date, { date, weightKg });
  }

  return {
    entries: [...entriesByDate.values()].toSorted((a, b) => a.date.localeCompare(b.date)),
    invalidLines,
  };
}
