import { describe, expect, it } from 'vitest';
import { compareRecipeLibraryOrder } from './recipeLibraryOrder';

describe('compareRecipeLibraryOrder', () => {
  it('sorts newest updates first with a deterministic descending ID tie-breaker', () => {
    const recipes = [
      { id: 'a', updatedAt: '2026-01-02T00:00:00.000Z' },
      { id: 'c', updatedAt: '2026-01-01T00:00:00.000Z' },
      { id: 'b', updatedAt: '2026-01-02T00:00:00.000Z' },
    ];

    expect(recipes.toSorted(compareRecipeLibraryOrder).map((recipe) => recipe.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
    expect(recipes.map((recipe) => recipe.id)).toEqual(['a', 'c', 'b']);
  });
});
