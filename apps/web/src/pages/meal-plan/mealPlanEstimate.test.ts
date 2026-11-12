import { describe, expect, it } from 'vitest';
import {
  estimateDay,
  estimateMeal,
  type MealPlanItem,
  mealName,
  mealQuickAddSearch,
  type PlannedRecipe,
} from './mealPlanEstimate';

const curry: PlannedRecipe = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Chicken curry',
  portions: 4,
  kcal: 2000,
  protein: 160,
  fats: 80,
  carbs: null,
};

function planned(overrides: Partial<MealPlanItem> = {}): MealPlanItem {
  return {
    id: '00000000-0000-4000-8000-000000000010',
    date: '2026-10-22',
    name: 'Chicken curry',
    portions: 1,
    recipe: curry,
    ...overrides,
  };
}

describe('estimateMeal', () => {
  it('scales whole-recipe nutrition to the planned portions', () => {
    expect(estimateMeal(planned({ portions: 1.5 }))).toEqual({
      kcal: 750,
      protein: 60,
      fat: 30,
      carbs: null,
    });
  });

  it('returns null instead of guessing for free-text meals and recipes without kcal', () => {
    expect(estimateMeal(planned({ recipe: null }))).toBeNull();
    expect(estimateMeal(planned({ recipe: { ...curry, kcal: null } }))).toBeNull();
  });
});

describe('estimateDay', () => {
  it('sums known meals and counts the ones without nutrition', () => {
    expect(
      estimateDay([planned(), planned({ portions: 2 }), planned({ recipe: null, name: 'Soup' })]),
    ).toEqual({ kcal: 1500, estimatedCount: 2, missingCount: 1 });
  });

  it('is empty for a day with no meals', () => {
    expect(estimateDay([])).toEqual({ kcal: 0, estimatedCount: 0, missingCount: 0 });
  });
});

describe('mealName', () => {
  it("prefers the linked recipe's current name over the saved one", () => {
    expect(mealName(planned({ name: 'Old name' }))).toBe('Chicken curry');
    expect(mealName(planned({ name: 'Leftovers', recipe: null }))).toBe('Leftovers');
  });
});

describe('mealQuickAddSearch', () => {
  it('prefills quick add with the plan date, name and rounded estimate', () => {
    expect(mealQuickAddSearch(planned({ portions: 0.33 }))).toEqual({
      date: '2026-10-22',
      name: 'Chicken curry',
      kcal: 165,
      protein: 13.2,
      fat: 6.6,
      carbs: undefined,
    });
  });

  it('leaves nutrition empty when nothing is known, so the user fills it in', () => {
    expect(mealQuickAddSearch(planned({ name: 'Soup', recipe: null }))).toEqual({
      date: '2026-10-22',
      name: 'Soup',
      kcal: undefined,
      protein: undefined,
      fat: undefined,
      carbs: undefined,
    });
  });
});
