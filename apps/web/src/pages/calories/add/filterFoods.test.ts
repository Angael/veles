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
    expect(filterFoods(foods, 'OAT', foods.length).map((food) => food.id)).toEqual(['1']);
    expect(filterFoods(foods, 'oatly', foods.length).map((food) => food.id)).toEqual(['1']);
  });

  it('matches ordered non-adjacent characters', () => {
    expect(filterFoods(foods, 'ot mlk', foods.length).map((food) => food.id)).toEqual(['1']);
  });

  it('preserves catalog order for an empty query', () => {
    expect(filterFoods(foods, '', foods.length)).toEqual(foods);
  });

  it('caps both unfiltered and ranked results', () => {
    const catalog: CalorieFood[] = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      name: `Oat milk ${String(11 - index).padStart(2, '0')}`,
      barcode: null,
      imageUrl: null,
      productSizeGrams: 250,
      kcalPer100g: 40,
      proteinPer100g: 1,
      fatPer100g: 2,
      carbsPer100g: 4,
    }));

    expect(filterFoods(catalog, '', 10)).toHaveLength(10);
    expect(filterFoods(catalog, 'oat', 10).map((food) => food.id)).toEqual([
      '11',
      '10',
      '9',
      '8',
      '7',
      '6',
      '5',
      '4',
      '3',
      '2',
    ]);
  });
});
