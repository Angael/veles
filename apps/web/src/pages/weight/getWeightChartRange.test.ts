import { describe, expect, it } from 'vitest';
import { getWeightChartRange } from './getWeightChartRange';

const entries = [
  { date: '2026-04-15', weightKg: 80 },
  { date: '2026-05-15', weightKg: 90 },
  { date: '2026-06-01', weightKg: 100 },
];

describe('getWeightChartRange', () => {
  it('uses a calendar window and interpolates its cutoff', () => {
    expect(getWeightChartRange(entries, '1m')).toEqual([
      { date: '2026-05-01', weightKg: 85.33333333333333 },
      { date: '2026-05-15', weightKg: 90 },
      { date: '2026-06-01', weightKg: 100 },
    ]);
  });

  it('does not invent a cutoff without an earlier measurement', () => {
    expect(getWeightChartRange(entries.slice(1), '1m')).toEqual(entries.slice(1));
  });

  it('returns every entry for all time', () => {
    expect(getWeightChartRange(entries, 'all')).toBe(entries);
  });

  it('clamps month-end cutoffs to the target month', () => {
    const monthEndEntries = [
      { date: '2026-01-01', weightKg: 80 },
      { date: '2026-02-15', weightKg: 85 },
      { date: '2026-03-31', weightKg: 90 },
    ];

    expect(getWeightChartRange(monthEndEntries, '1m').at(0)?.date).toBe('2026-02-28');
  });
});
