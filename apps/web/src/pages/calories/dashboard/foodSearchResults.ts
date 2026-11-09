import type { CalorieFood } from '../calories.api';
import { filterFoods } from '../add/filterFoods';
import { foodProductNames } from '../calorieHelpers';
import type { Locale } from '@/lib/i18n/locale';
import type { RecipeLibraryItem } from '@/pages/recipes/recipes.api';
import { isLoggableIngredient } from '@/pages/recipes/recipeNutrition';

export type FoodSearchResult =
  | { food: CalorieFood; kind: 'food' }
  | { kind: 'recipe'; recipe: RecipeLibraryItem }
  | { kind: 'create'; name: string };

const MAX_FOODS = 10;
const MAX_RECIPES = 3;

function matchingRecipes(recipes: RecipeLibraryItem[], query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return recipes
    .filter(
      (recipe) =>
        recipe.ingredients.some(isLoggableIngredient) &&
        terms.every((term) => recipe.name.toLocaleLowerCase().includes(term)),
    )
    .slice(0, MAX_RECIPES);
}

/**
 * Builds one option list for the diary search: recipes, then foods, then "create" for a typed
 * name. A single list keeps every result reachable with the arrow keys.
 */
export function foodSearchResults(
  foods: CalorieFood[],
  recipes: RecipeLibraryItem[],
  query: string,
  locale: Locale,
): FoodSearchResult[] {
  const name = query.trim();
  return [
    ...matchingRecipes(recipes, query).map((recipe) => ({ kind: 'recipe' as const, recipe })),
    ...filterFoods(foods, query, MAX_FOODS, locale).map((food) => ({
      food,
      kind: 'food' as const,
    })),
    ...(name ? [{ kind: 'create' as const, name }] : []),
  ];
}

export function foodSearchResultKey(result: FoodSearchResult) {
  if (result.kind === 'food') return result.food.id;
  return result.kind === 'recipe' ? result.recipe.id : 'create';
}

/** Text for the combobox's accessibility and input syncing. */
export function foodSearchResultLabel(result: FoodSearchResult, locale: Locale) {
  if (result.kind === 'food') return foodProductNames(result.food)[locale];
  return result.kind === 'recipe' ? result.recipe.name : result.name;
}
