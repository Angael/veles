import { describe, expect, it } from 'vitest';
import { splitRecipeText } from './recipeText';

describe('splitRecipeText', () => {
  it('preserves spaces and blank lines entered in recipe text fields', () => {
    expect(splitRecipeText('  olive oil  \n\n  lemon juice  ', '\n')).toEqual([
      '  olive oil  ',
      '',
      '  lemon juice  ',
    ]);
  });
});
