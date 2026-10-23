import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { foodLogs, foodProducts, recipeIngredients, recipes } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { translate } from '@/lib/i18n/getLocale';
import { HUNDREDTHS } from '@/lib/nutrition';
import { db } from '@/server/db.server';
import { productLogValues } from '@/pages/calories/foodLogs.server';
import { accessibleRecipe } from './recipes.server';
import type { logRecipeInputType } from './recipes.validation';

/**
 * Logs the chosen ingredients of an own or shared recipe, scaled from the recipe's portions to
 * the eaten portions, in one insert. The client-made log ids make a retried submit a no-op.
 */
export async function logRecipeRecord(
  userId: string,
  { date, items, portions, recipeId }: typeof logRecipeInputType.infer,
) {
  const loggable = await db
    .select({
      gramsHundredths: recipeIngredients.gramsHundredths,
      id: recipeIngredients.id,
      product: foodProducts,
      recipePortions: recipes.portions,
    })
    .from(recipeIngredients)
    .innerJoin(recipes, eq(recipes.id, recipeIngredients.recipeId))
    .innerJoin(foodProducts, eq(foodProducts.id, recipeIngredients.productId))
    .where(
      and(
        eq(recipes.id, recipeId),
        accessibleRecipe(userId),
        isNotNull(recipeIngredients.gramsHundredths),
        inArray(
          recipeIngredients.id,
          items.map((item) => item.ingredientId),
        ),
      ),
    );
  const byId = new Map(loggable.map((row) => [row.id, row]));
  const now = Date.now();

  const rows = items.map((item, index) => {
    const row = byId.get(item.ingredientId);
    if (!row?.gramsHundredths)
      throw new ClientSafeError(
        translate({
          en: 'Only ingredients linked to a product with an amount can be logged.',
          pl: 'Zapisać można tylko składniki powiązane z produktem i mające ilość.',
        }),
      );
    const grams = ((row.gramsHundredths / HUNDREDTHS) * portions) / row.recipePortions;
    return {
      ...productLogValues(row.product, grams),
      id: item.logId,
      imageUploadObjectId: row.product.imageUploadObjectId,
      logDate: date,
      // Newest first on the dashboard, so earlier ingredients get later times to keep recipe order.
      consumedAt: new Date(now - index),
      userId,
    };
  });

  const inserted = await db
    .insert(foodLogs)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: foodLogs.id });
  return { logged: inserted.length };
}
