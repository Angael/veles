import { asc, eq, inArray } from 'drizzle-orm';
import { foodProducts, recipeIngredients, uploadObjects } from '@veles/db/schema';
import { foodProductCategory } from '@veles/db/seed/food-products';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { translate } from '@/lib/i18n/getLocale';
import { fromHundredths, HUNDREDTHS, toHundredths } from '@/lib/nutrition';
import { db, type DbTransaction } from '@/server/db.server';
import { storagePathToUrl } from '@/server/storage/config.server';
import { foodProductNames } from '@/pages/calories/calorieHelpers';
import type { RecipeIngredient } from './recipeNutrition';
import type { RecipeIngredientInput } from './recipes.validation';

type Db = typeof db | DbTransaction;

/**
 * Loads the ordered ingredients of the given recipes with their linked product's current
 * nutrition per 100 g, so recipe totals follow product edits. Linked ingredients show the
 * product's localized name; the stored name is used once the product is gone.
 */
export async function getRecipeIngredients(recipeIds: string[], tx: Db = db) {
  const byRecipeId = new Map<string, RecipeIngredient[]>();
  if (recipeIds.length === 0) return byRecipeId;

  const rows = await tx
    .select({ asset: uploadObjects, ingredient: recipeIngredients, product: foodProducts })
    .from(recipeIngredients)
    .leftJoin(foodProducts, eq(foodProducts.id, recipeIngredients.productId))
    .leftJoin(uploadObjects, eq(uploadObjects.id, foodProducts.imageUploadObjectId))
    .where(inArray(recipeIngredients.recipeId, recipeIds))
    .orderBy(asc(recipeIngredients.position));

  for (const { asset, ingredient, product } of rows) {
    const list = byRecipeId.get(ingredient.recipeId) ?? [];
    list.push({
      id: ingredient.id,
      name: product ? translate(foodProductNames(product)) : ingredient.name,
      productId: product?.id ?? null,
      grams: fromHundredths(ingredient.gramsHundredths),
      imageUrl: asset ? storagePathToUrl(asset.key) : null,
      category: product ? foodProductCategory(product.seedKey) : null,
      per100g: product
        ? {
            kcal: product.kcalPer100gHundredths / HUNDREDTHS,
            protein: fromHundredths(product.proteinPer100gHundredths),
            fat: fromHundredths(product.fatPer100gHundredths),
            carbs: fromHundredths(product.carbsPer100gHundredths),
          }
        : null,
    });
    byRecipeId.set(ingredient.recipeId, list);
  }
  return byRecipeId;
}

/**
 * Replaces a recipe's ingredient list in the caller's transaction. Every product id must exist;
 * a linked ingredient without a name takes the product's name as its snapshot.
 */
export async function replaceRecipeIngredients(
  tx: DbTransaction,
  recipeId: string,
  ingredients: RecipeIngredientInput[],
) {
  const productIds = [...new Set(ingredients.flatMap((ingredient) => ingredient.productId ?? []))];
  const products = productIds.length
    ? await tx
        .select({ id: foodProducts.id, name: foodProducts.name, namePl: foodProducts.namePl })
        .from(foodProducts)
        .where(inArray(foodProducts.id, productIds))
    : [];
  const productsById = new Map(products.map((product) => [product.id, product]));
  const missing = productIds.filter((id) => !productsById.has(id));
  if (missing.length) {
    throw new ClientSafeError(
      translate({
        en: `Unknown food product: ${missing.join(', ')}.`,
        pl: `Nieznany produkt: ${missing.join(', ')}.`,
      }),
    );
  }

  await tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId));
  if (ingredients.length === 0) return;

  await tx.insert(recipeIngredients).values(
    ingredients.map((ingredient, position) => {
      const product = ingredient.productId ? productsById.get(ingredient.productId) : undefined;
      return {
        recipeId,
        position,
        productId: product?.id ?? null,
        name: ingredient.name || (product ? translate(foodProductNames(product)) : ''),
        gramsHundredths: ingredient.grams ? toHundredths(ingredient.grams) : null,
      };
    }),
  );
}
