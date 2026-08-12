import { describe, expect, it } from 'vitest';
import { canManageRecipe } from './recipeAccess';

describe('canManageRecipe', () => {
  it('allows the recipe owner to manage the recipe', () => {
    expect(canManageRecipe('owner-id', 'owner-id')).toBe(true);
  });

  it('denies management to unauthenticated and non-owner viewers', () => {
    expect(canManageRecipe('owner-id', null)).toBe(false);
    expect(canManageRecipe('owner-id', 'other-user-id')).toBe(false);
  });
});
