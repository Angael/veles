import type { I18n } from '@/lib/i18n/I18nProvider';
import type { RecipeIngredient } from '../recipeNutrition';

/** Ingredient text with its amount scaled to the picked portions, e.g. `Rice – 150 g`. */
export function ingredientLine(
  ingredient: RecipeIngredient,
  scale: number,
  formatWhole: I18n['formatWhole'],
) {
  if (ingredient.grams === null) return ingredient.name;
  return `${ingredient.name} – ${formatWhole(ingredient.grams * scale)} g`;
}
