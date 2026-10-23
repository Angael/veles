import { foodProductSeeds, retiredFoodProductSeedKeys } from '@veles/db/seed/food-products';
import { describe, expect, it } from 'vitest';

const seedKeys = foodProductSeeds.map((seed) => seed.seedKey);

describe('foodProductSeeds', () => {
  it('uses each seed key once', () => {
    expect(new Set(seedKeys).size).toBe(seedKeys.length);
    expect(new Set(retiredFoodProductSeedKeys).size).toBe(retiredFoodProductSeedKeys.length);
  });

  it('never reuses a retired seed key', () => {
    expect(seedKeys.filter((key) => retiredFoodProductSeedKeys.includes(key))).toEqual([]);
  });

  it('offers a single whole egg next to egg white and yolk', () => {
    const eggKeys = foodProductSeeds
      .filter((seed) => seed.category === 'egg')
      .map((seed) => seed.seedKey);

    expect(eggKeys).toEqual(['egg-whole-raw', 'egg-white-raw', 'egg-yolk-raw']);
  });
});
