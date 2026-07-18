import { describe, expect, it } from 'vitest';
import { getValidRecipeImageIndex } from './recipeImageIndex';

describe('getValidRecipeImageIndex', () => {
  it.each([
    [0, 1, 0],
    [1, 2, 1],
    [1, 1, 0],
    [3, 0, 0],
    [-1, 2, 0],
    [0.5, 2, 0],
  ])('clamps index %s for %s images to %s', (index, imageCount, expected) => {
    expect(getValidRecipeImageIndex(index, imageCount)).toBe(expected);
  });
});
