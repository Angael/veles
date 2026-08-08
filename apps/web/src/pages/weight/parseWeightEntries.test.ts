import { describe, expect, it } from 'vitest';
import { parseWeightEntries } from './parseWeightEntries';

describe('parseWeightEntries', () => {
  it('normalizes, sorts, and replaces duplicate dates with the last value', () => {
    expect(parseWeightEntries('2026-08-02 78,1kg\n2026-08-01 78.4 kg\n2026-08-02 77.9kg')).toEqual({
      entries: [
        { date: '2026-08-01', weightKg: 78.4 },
        { date: '2026-08-02', weightKg: 77.9 },
      ],
      errors: [],
    });
  });

  it('reports invalid dates, formats, and weights by line', () => {
    expect(parseWeightEntries('2026-02-30 78kg\n2026-08-02 20kg\nnot a weight')).toEqual({
      entries: [],
      errors: ['Line 1 is invalid.', 'Line 2 is invalid.', 'Line 3 is invalid.'],
    });
  });
});
