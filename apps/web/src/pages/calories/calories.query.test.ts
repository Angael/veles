import { describe, expect, it, vi } from 'vitest';

vi.mock('./calories.api', () => ({
  getCalorieDashboard: vi.fn(),
  getFoodProduct: vi.fn(),
  getFoodProducts: vi.fn(),
}));

vi.mock('./goals/goals.api', () => ({
  setDailyCalorieGoal: vi.fn(),
}));

import { calorieDashboardQueryOptions } from './calories.query';

describe('calorie query keys', () => {
  it('uses one dashboard cache entry for every date in the same week', () => {
    const monday = calorieDashboardQueryOptions('2026-08-17').queryKey;
    const wednesday = calorieDashboardQueryOptions('2026-08-19').queryKey;
    const nextMonday = calorieDashboardQueryOptions('2026-08-24').queryKey;

    expect(wednesday).toEqual(monday);
    expect(nextMonday).not.toEqual(monday);
  });
});
