import { and, desc, eq } from 'drizzle-orm';
import { mealPlanItems, recipes } from '@veles/db/schema';
import { HUNDREDTHS } from '@/lib/nutrition';
import { db } from '@/server/db.server';
import { withRecipeNutrition } from '@/pages/meal-plan/mealPlan.server';
import { estimateMeal } from '@/pages/meal-plan/mealPlanEstimate';
import { byIdDesc, inDateRange, type ReadQuery, toPage } from './mcp-read-helpers.server';

const round = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10);

/** Owned planned meals, newest first, with the linked own recipe and a portion-scaled estimate. */
export async function readMealPlan(userId: string, query: ReadQuery) {
  const rows = await db
    .select({
      id: mealPlanItems.id,
      date: mealPlanItems.date,
      name: mealPlanItems.name,
      portionsHundredths: mealPlanItems.portionsHundredths,
      recipe: { id: recipes.id, name: recipes.name, portions: recipes.portions },
    })
    .from(mealPlanItems)
    .leftJoin(
      recipes,
      and(eq(recipes.id, mealPlanItems.recipeId), eq(recipes.userId, mealPlanItems.userId)),
    )
    .where(
      and(
        eq(mealPlanItems.userId, userId),
        inDateRange(mealPlanItems.date, query),
        byIdDesc(mealPlanItems.id, query),
      ),
    )
    .orderBy(desc(mealPlanItems.id))
    .limit(query.limit + 1);
  const page = toPage(rows, query.limit, (row) => row.id);

  const withNutrition = await withRecipeNutrition(
    page.items.flatMap((row) => (row.recipe ? [row.recipe] : [])),
  );
  const recipeById = new Map(withNutrition.map((recipe) => [recipe.id, recipe]));

  return {
    nextCursor: page.nextCursor,
    items: page.items.map(({ portionsHundredths, recipe, ...row }) => {
      const portions = portionsHundredths / HUNDREDTHS;
      const planned = recipe ? (recipeById.get(recipe.id) ?? null) : null;
      const estimate = estimateMeal({ portions, recipe: planned });
      return {
        ...row,
        name: recipe?.name ?? row.name,
        portions,
        recipe,
        estimate: estimate && {
          kcal: Math.round(estimate.kcal),
          macros: {
            protein: round(estimate.protein),
            fat: round(estimate.fat),
            carbs: round(estimate.carbs),
          },
        },
      };
    }),
  };
}
