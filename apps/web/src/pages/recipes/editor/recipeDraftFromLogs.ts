import type { RecipeFormDraft } from './RecipeForm';

export type RecipeSourceLog = {
  carbs: number | null;
  fat: number | null;
  grams: number | null;
  kcal: number;
  name: string;
  productId: string | null;
  protein: number | null;
};

type Ingredient = { grams: number | null; name: string };

/**
 * Prefills a recipe from food logs the user ate together: one ingredient line per product with
 * grams summed when it was logged more than once, and whole-recipe totals for one portion.
 * Custom entries without a product stay separate since only the product proves they are the same.
 */
export function recipeDraftFromLogs(
  logs: RecipeSourceLog[],
  formatGrams: (grams: number) => string,
): RecipeFormDraft {
  const ingredients: Ingredient[] = [];
  const byProductId = new Map<string, Ingredient>();

  for (const log of logs) {
    const existing = log.productId ? byProductId.get(log.productId) : undefined;
    if (existing) {
      existing.grams = sumNullable(existing.grams, log.grams);
      continue;
    }
    const ingredient = { grams: log.grams, name: log.name };
    ingredients.push(ingredient);
    if (log.productId) byProductId.set(log.productId, ingredient);
  }

  return {
    carbs: totalOf(logs, 'carbs'),
    description: '',
    fats: totalOf(logs, 'fat'),
    ingredients: ingredients.map(({ grams, name }) =>
      grams === null ? name : `${name} – ${formatGrams(grams)} g`,
    ),
    kcal: Math.round(logs.reduce((sum, log) => sum + log.kcal, 0)),
    name: '',
    portions: 1,
    protein: totalOf(logs, 'protein'),
    rating: null,
    tags: [],
  };
}

function sumNullable(left: number | null, right: number | null) {
  return left === null && right === null ? null : (left ?? 0) + (right ?? 0);
}

/** Rounded macro total; null only when no log tracked that macro, so unknown never shows as 0 g. */
function totalOf(logs: RecipeSourceLog[], key: 'carbs' | 'fat' | 'protein') {
  const total = logs.reduce<number | null>((sum, log) => sumNullable(sum, log[key]), null);
  return total === null ? null : Math.round(total);
}
