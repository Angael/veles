import type { RecipeIngredient } from '../recipeNutrition';

/** Ingredient text with its amount scaled to the picked portions, e.g. `Rice – 150 g`. */
export function ingredientLine(
  ingredient: RecipeIngredient,
  scale: number,
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string,
) {
  if (ingredient.grams === null) return ingredient.name;
  const grams = formatNumber(ingredient.grams * scale, { maximumFractionDigits: 0 });
  return `${ingredient.name} – ${grams} g`;
}
