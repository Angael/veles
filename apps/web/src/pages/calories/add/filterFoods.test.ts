import { describe, expect, it } from 'vitest';
import type { CalorieFood } from '../calories.api';
import { filterFoods } from './filterFoods';

const foods: CalorieFood[] = [
  {
    id: '1',
    name: 'Oat milk (Oatly)',
    barcode: null,
    imageUrl: null,
    productSizeGrams: 250,
    kcalPer100g: 40,
    proteinPer100g: 1,
    fatPer100g: 2,
    carbsPer100g: 4,
  },
  {
    id: '2',
    name: 'Banana',
    barcode: null,
    imageUrl: null,
    productSizeGrams: null,
    kcalPer100g: 89,
    proteinPer100g: 1,
    fatPer100g: 0,
    carbsPer100g: 23,
  },
];

describe('filterFoods', () => {
  it('matches case-insensitive substrings in collapsed product names', () => {
    expect(filterFoods(foods, 'OAT').map((food) => food.id)).toEqual(['1']);
    expect(filterFoods(foods, 'oatly').map((food) => food.id)).toEqual(['1']);
  });

  it('matches ordered non-adjacent characters', () => {
    expect(filterFoods(foods, 'ot mlk').map((food) => food.id)).toEqual(['1']);
  });

  it('preserves catalog order for an empty query', () => {
    expect(filterFoods(foods, '')).toEqual(foods);
  });
});
