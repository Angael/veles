import { describe, expect, it } from 'vitest';
import { foodProductUnit, foodProductSeeds } from '@veles/db/seed/food-products';
import { foodUnitAmountText, foodUnitSizeLabel } from './foodUnits';

describe('foodProductUnit', () => {
  it('keeps products without a unit or seed as packages', () => {
    expect(foodProductUnit(null, null)).toBe('package');
    expect(foodProductUnit(null, 'unknown-seed')).toBe('package');
  });

  it('uses seed defaults so seeded eggs and fruit are pieces and the rest servings', () => {
    expect(foodProductUnit(null, 'egg-whole-raw')).toBe('piece');
    expect(foodProductUnit(null, 'avocado')).toBe('piece');
    expect(foodProductUnit(null, 'white-bread')).toBe('slice');
    expect(foodProductUnit(null, 'rice-white-dry')).toBe('serving');
  });

  it('prefers a saved unit and ignores unknown stored values', () => {
    expect(foodProductUnit('package', 'egg-whole-raw')).toBe('package');
    expect(foodProductUnit('piece', null)).toBe('piece');
    expect(foodProductUnit('bogus', null)).toBe('package');
  });

  it('gives every seed a non-package unit, since seed sizes are items or servings', () => {
    for (const seed of foodProductSeeds) {
      expect(foodProductUnit(null, seed.seedKey)).not.toBe('package');
    }
  });
});

describe('foodUnitAmountText', () => {
  it('declines unit names for each shortcut', () => {
    expect(foodUnitAmountText('piece', 0.5)).toEqual({ en: '½ piece', pl: '½ sztuki' });
    expect(foodUnitAmountText('piece', 1)).toEqual({ en: '1 piece', pl: '1 sztuka' });
    expect(foodUnitAmountText('piece', 2)).toEqual({ en: '2 pieces', pl: '2 sztuki' });
    expect(foodUnitAmountText('package', 2)).toEqual({ en: '2 packages', pl: '2 opakowania' });
    expect(foodUnitAmountText('serving', 0.5)).toEqual({ en: '½ serving', pl: '½ porcji' });
  });

  it('labels the editor size field with the chosen unit', () => {
    expect(foodUnitSizeLabel('slice')).toEqual({
      en: 'Weight of 1 slice (g)',
      pl: 'Waga 1 plastra (g)',
    });
  });
});
