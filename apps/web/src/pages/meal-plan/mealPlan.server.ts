import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { mealPlanItems, recipes } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { translate } from '@/lib/i18n/getLocale';
import { HUNDREDTHS, toHundredths } from '@/lib/nutrition';
import { db } from '@/server/db.server';
import { getRecipeIngredients } from '@/pages/recipes/recipeIngredients.server';
import { sumIngredientNutrition } from '@/pages/recipes/recipeNutrition';
import type { MealPlanItem, PlannedRecipe } from './mealPlanEstimate';
import type { deleteMealPlanItemInputType, saveMealPlanItemInputType } from './mealPlan.validation';

const plannedRecipeColumns = {
  id: recipes.id,
  name: recipes.name,
  portions: recipes.portions,
};

type RecipeRow = { id: string; name: string; portions: number };

/** Adds each recipe's nutrition from its ingredients, so plans follow recipe and product edits. */
export async function withRecipeNutrition(rows: RecipeRow[]): Promise<PlannedRecipe[]> {
  const ingredients = await getRecipeIngredients([...new Set(rows.map((recipe) => recipe.id))]);
  return rows.map((recipe) => {
    const nutrition = sumIngredientNutrition(ingredients.get(recipe.id) ?? []);
    return {
      ...recipe,
      kcal: nutrition?.kcal ?? null,
      protein: nutrition?.protein ?? null,
      fats: nutrition?.fat ?? null,
      carbs: nutrition?.carbs ?? null,
    };
  });
}

/** The user's planned meals from `from` to `to` inclusive, oldest first, with their own recipes. */
export async function getMealPlanItems(
  userId: string,
  from: string,
  to: string,
): Promise<MealPlanItem[]> {
  const rows = await db
    .select({
      id: mealPlanItems.id,
      date: mealPlanItems.date,
      name: mealPlanItems.name,
      portionsHundredths: mealPlanItems.portionsHundredths,
      recipe: plannedRecipeColumns,
    })
    .from(mealPlanItems)
    // The owner check keeps a plan from ever exposing another user's recipe.
    .leftJoin(
      recipes,
      and(eq(recipes.id, mealPlanItems.recipeId), eq(recipes.userId, mealPlanItems.userId)),
    )
    .where(
      and(
        eq(mealPlanItems.userId, userId),
        gte(mealPlanItems.date, from),
        lte(mealPlanItems.date, to),
      ),
    )
    .orderBy(asc(mealPlanItems.date), asc(mealPlanItems.createdAt));

  const plannedRecipes = await withRecipeNutrition(
    rows.flatMap((row) => (row.recipe ? [row.recipe] : [])),
  );
  const recipeById = new Map(plannedRecipes.map((recipe) => [recipe.id, recipe]));
  return rows.map(({ portionsHundredths, recipe, ...row }) => ({
    ...row,
    portions: portionsHundredths / HUNDREDTHS,
    recipe: recipe ? (recipeById.get(recipe.id) ?? null) : null,
  }));
}

/** Recipes the user can plan: only their own, alphabetically. */
export async function getPlannableRecipes(userId: string): Promise<PlannedRecipe[]> {
  const rows = await db
    .select(plannedRecipeColumns)
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .orderBy(asc(recipes.name));
  return withRecipeNutrition(rows);
}

/**
 * Creates or updates a planned meal. Recipe meals save the owned recipe's name as a fallback;
 * changing the date moves the meal without touching other days.
 */
export async function saveMealPlanItemRecord(
  userId: string,
  data: typeof saveMealPlanItemInputType.infer,
) {
  const name = data.recipeId ? await requireOwnedRecipeName(userId, data.recipeId) : data.name;
  if (!name) {
    throw new ClientSafeError(translate({ en: 'Enter a meal name.', pl: 'Wpisz nazwę posiłku.' }));
  }
  const values = {
    date: data.date,
    recipeId: data.recipeId,
    name,
    portionsHundredths: toHundredths(data.portions),
  };

  if (!data.id) {
    const [row] = await db
      .insert(mealPlanItems)
      .values({ ...values, userId })
      .returning({ id: mealPlanItems.id });
    if (!row) throw new Error('Meal plan insert returned no row.');
    return row;
  }

  const [row] = await db
    .update(mealPlanItems)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(mealPlanItems.id, data.id), eq(mealPlanItems.userId, userId)))
    .returning({ id: mealPlanItems.id });
  if (!row) throw mealNotFound();
  return row;
}

export async function deleteMealPlanItemRecord(
  userId: string,
  { id }: typeof deleteMealPlanItemInputType.infer,
) {
  const [row] = await db
    .delete(mealPlanItems)
    .where(and(eq(mealPlanItems.id, id), eq(mealPlanItems.userId, userId)))
    .returning({ id: mealPlanItems.id });
  if (!row) throw mealNotFound();
  return row;
}

async function requireOwnedRecipeName(userId: string, recipeId: string) {
  const [recipe] = await db
    .select({ name: recipes.name })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
    .limit(1);
  if (!recipe) {
    throw new ClientSafeError(
      translate({ en: 'Recipe not found.', pl: 'Nie znaleziono przepisu.' }),
    );
  }
  return recipe.name;
}

function mealNotFound() {
  return new ClientSafeError(
    translate({ en: 'Planned meal not found.', pl: 'Nie znaleziono zaplanowanego posiłku.' }),
  );
}
