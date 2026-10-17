import { describe, expect, it } from 'vitest';
import type { CalorieFoodSuggestion } from '../calories.api';
import { filterFoods } from './filterFoods';

const foods: CalorieFoodSuggestion[] = [
  {
    id: '1',
    name: 'Oat milk (Oatly)',
    namePl: null,
    barcode: null,
    imageUrl: null,
    productSizeGrams: 250,
    kcalPer100g: 40,
    proteinPer100g: 1,
    fatPer100g: 2,
    carbsPer100g: 4,
    lastLoggedAt: null,
  },
  {
    id: '2',
    name: 'Banana',
    namePl: null,
    barcode: null,
    imageUrl: null,
    productSizeGrams: null,
    kcalPer100g: 89,
    proteinPer100g: 1,
    fatPer100g: 0,
    carbsPer100g: 23,
    lastLoggedAt: null,
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
    const catalog: CalorieFoodSuggestion[] = Array.from({ length: 12 }, (_, index) => ({
      id: String(index),
      name: `Oat milk ${String(11 - index).padStart(2, '0')}`,
      namePl: null,
      barcode: null,
      imageUrl: null,
      productSizeGrams: 250,
      kcalPer100g: 40,
      proteinPer100g: 1,
      fatPer100g: 2,
      carbsPer100g: 4,
      lastLoggedAt: null,
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

  it('ranks recently logged matches above generic matches', () => {
    const food = (id: string, name: string, lastLoggedAt: string | null) => ({
      id,
      name,
      namePl: null,
      barcode: null,
      imageUrl: null,
      productSizeGrams: null,
      kcalPer100g: 52,
      proteinPer100g: 0,
      fatPer100g: 0,
      carbsPer100g: 14,
      lastLoggedAt,
    });
    const catalog = [
      food('apple', 'Apple', null),
      food('pie', 'Apple Pie', '2026-10-10T12:00:00.000Z'),
      food('juice', 'Apple juice', '2026-10-01T12:00:00.000Z'),
      food('pear', 'Pear', '2026-10-16T12:00:00.000Z'),
    ];

    expect(filterFoods(catalog, 'Appl', 10).map(({ id }) => id)).toEqual(['pie', 'juice', 'apple']);
  });
});
