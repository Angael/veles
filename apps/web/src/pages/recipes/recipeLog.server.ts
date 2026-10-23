import { and, eq, inArray, or } from 'drizzle-orm';
import { foodLogs, foodProducts, recipes, userSharingSettings } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { translate } from '@/lib/i18n/getLocale';
import { db } from '@/server/db.server';
import { getSharingFriendsIds } from '@/server/getSharingFriendsIds.server';
import { productLogValues } from '@/pages/calories/foodLogs.server';
import { getRecipeIngredients } from './recipeIngredients.server';
import { isLoggableIngredient } from './recipeNutrition';
import type { logRecipeInputType } from './recipes.validation';

/**
 * Logs the chosen linked ingredients of an own or shared recipe, scaled from the recipe's
 * portions to the eaten portions. All rows go in one insert; the client-made log ids make a
 * retried submit a no-op. Custom ingredients have no nutrition and are rejected.
 */
export async function logRecipeRecord(
  userId: string,
  { date, items, portions, recipeId }: typeof logRecipeInputType.infer,
) {
  const sharingFriendIds = getSharingFriendsIds(userId, userSharingSettings.shareRecipes);
  const [recipe] = await db
    .select({ portions: recipes.portions })
    .from(recipes)
    .where(
      and(
        eq(recipes.id, recipeId),
        or(eq(recipes.userId, userId), inArray(recipes.userId, sharingFriendIds)),
      ),
    )
    .limit(1);
  if (!recipe)
    throw new ClientSafeError(
      translate({ en: 'Recipe not found.', pl: 'Nie znaleziono przepisu.' }),
    );

  const ingredients = (await getRecipeIngredients([recipeId])).get(recipeId) ?? [];
  const chosen = items.map((item) => {
    const ingredient = ingredients.find((candidate) => candidate.id === item.ingredientId);
    if (!ingredient || !isLoggableIngredient(ingredient))
      throw new ClientSafeError(
        translate({
          en: 'Only ingredients linked to a product with an amount can be logged.',
          pl: 'Zapisać można tylko składniki powiązane z produktem i mające ilość.',
        }),
      );
    return { ingredient, logId: item.logId };
  });

  const products = await db
    .select()
    .from(foodProducts)
    .where(inArray(foodProducts.id, [...new Set(chosen.map((c) => c.ingredient.productId))]));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const scale = portions / recipe.portions;
  const now = Date.now();

  const rows = chosen.flatMap(({ ingredient, logId }, index) => {
    const product = productsById.get(ingredient.productId);
    if (!product) return [];
    return {
      ...productLogValues(product, ingredient.grams * scale),
      id: logId,
      imageUploadObjectId: product.imageUploadObjectId,
      logDate: date,
      // Newest first on the dashboard, so earlier ingredients get later times to keep recipe order.
      consumedAt: new Date(now - index),
      userId,
    };
  });

  if (rows.length === 0) return { logged: 0 };
  // One multi-row insert, so either every chosen ingredient is logged or none is.
  const inserted = await db
    .insert(foodLogs)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: foodLogs.id });
  return { logged: inserted.length };
}
