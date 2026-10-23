import { v7 as uuidv7 } from 'uuid';
import type { RecipeIngredient } from '../recipeNutrition';
import type { RecipeIngredientInput } from '../recipes.validation';

/** One editor row; `key` only keeps React rows stable while rows are added and removed. */
export type IngredientDraft = {
  grams: number | null;
  key: string;
  name: string;
  productId: string | null;
};

export type RecipeFormDraft = {
  description: string;
  ingredients: IngredientDraft[];
  name: string;
  portions: number;
  rating: number | null;
};

export function ingredientDraft(
  values: Partial<Omit<IngredientDraft, 'key'>> = {},
): IngredientDraft {
  return { grams: null, name: '', productId: null, ...values, key: uuidv7() };
}

export function emptyRecipeDraft(): RecipeFormDraft {
  return {
    description: '',
    ingredients: [ingredientDraft()],
    name: '',
    portions: 1,
    rating: null,
  };
}

export function ingredientsFromRecipe(ingredients: RecipeIngredient[]) {
  return ingredients.map(({ grams, name, productId }) =>
    ingredientDraft({ grams, name, productId }),
  );
}

/** The editor rows as the JSON the server expects; blank rows are dropped on the server. */
export function ingredientsToInput(ingredients: IngredientDraft[]): RecipeIngredientInput[] {
  return ingredients.map(({ grams, name, productId }) => ({ grams, name, productId }));
}
