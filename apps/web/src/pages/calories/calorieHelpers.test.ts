import { describe, expect, it } from 'vitest';
import { isWithinKcalGoal } from './calorieHelpers';

describe('isWithinKcalGoal', () => {
  it('accepts totals at either 10 percent boundary', () => {
    expect(isWithinKcalGoal(18_000, 20_000)).toBe(true);
    expect(isWithinKcalGoal(22_000, 20_000)).toBe(true);
  });

  it('rejects totals outside the 10 percent range', () => {
    expect(isWithinKcalGoal(17_999, 20_000)).toBe(false);
    expect(isWithinKcalGoal(22_001, 20_000)).toBe(false);
  });
});
