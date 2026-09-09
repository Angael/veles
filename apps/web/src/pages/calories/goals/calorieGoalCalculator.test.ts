import { describe, expect, it } from 'vitest';
import {
  estimateMaintenanceKcal,
  macrosFromPercentages,
  percentagesFromMacros,
} from './calorieGoalCalculator';

describe('calorie goal calculator', () => {
  it('estimates maintenance calories with Mifflin–St Jeor and activity', () => {
    expect(
      estimateMaintenanceKcal({
        age: 30,
        sex: 'male',
        weightKg: 80,
        heightCm: 180,
        activity: 'moderate',
      }),
    ).toBe(2759);
  });

  it('converts calorie percentages to gram targets in kcal, protein, fat, carbs order', () => {
    expect(macrosFromPercentages(2000, { protein: 25, fat: 30, carbs: 45 })).toEqual({
      kcal: 2000,
      protein: 125,
      fat: 66.7,
      carbs: 225,
    });
  });

  it('reflects direct gram edits back into calorie percentages', () => {
    expect(percentagesFromMacros({ kcal: 2000, protein: 150, fat: 60, carbs: 215 })).toEqual({
      protein: 30,
      fat: 27,
      carbs: 43,
    });
  });
});
