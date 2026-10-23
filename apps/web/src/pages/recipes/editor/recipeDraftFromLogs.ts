import { sumNullable } from '../recipeNutrition';
import { emptyRecipeDraft, ingredientDraft, type RecipeFormDraft } from './recipeDraft';

export type RecipeSourceLog = {
  grams: number | null;
  name: string;
  productId: string | null;
};

/**
 * Prefills a recipe from food logs the user ate together: a log of a product becomes a linked
 * ingredient, with grams summed when the product was logged more than once. Custom logs become
 * custom ingredients and stay separate, since only a shared product proves two logs are the same.
 */
export function recipeDraftFromLogs(logs: RecipeSourceLog[]): RecipeFormDraft {
  const ingredients: ReturnType<typeof ingredientDraft>[] = [];
  const byProductId = new Map<string, ReturnType<typeof ingredientDraft>>();

  for (const log of logs) {
    const existing = log.productId ? byProductId.get(log.productId) : undefined;
    if (existing) {
      existing.grams = sumNullable(existing.grams, log.grams);
      continue;
    }
    const ingredient = ingredientDraft({
      fromLogWithoutProduct: !log.productId,
      grams: log.grams,
      name: log.name,
      productId: log.productId,
    });
    ingredients.push(ingredient);
    if (log.productId) byProductId.set(log.productId, ingredient);
  }

  return { ...emptyRecipeDraft(), ingredients };
}
