import { type } from 'arktype';
import { and, eq, inArray, or } from 'drizzle-orm';
import { recipes, userSharingSettings } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db, type DbTransaction } from '@/server/db.server';
import { getSharingFriendsIds } from '@/server/getSharingFriendsIds.server';
import { replaceRecipeIngredients } from './recipeIngredients.server';
import {
  recipeFieldsType,
  type saveRecipeInputType,
  type updateRecipeFieldsInputType,
  type updateRecipeRatingInputType,
} from './recipes.validation';
import { translate } from '@/lib/i18n/getLocale';

type RecipeFields = typeof recipeFieldsType.infer;

/** Matches recipes the user owns or that a friend shares with them; both are readable and editable. */
export function accessibleRecipe(userId: string) {
  return or(
    eq(recipes.userId, userId),
    inArray(recipes.userId, getSharingFriendsIds(userId, userSharingSettings.shareRecipes)),
  );
}

export async function createRecipeRow(
  tx: DbTransaction,
  userId: string,
  { ingredients, ...fields }: RecipeFields,
) {
  const [recipe] = await tx
    .insert(recipes)
    .values({ ...fields, userId })
    .returning({ id: recipes.id });
  if (!recipe) throw new Error('Recipe insert returned no row.');
  await replaceRecipeIngredients(tx, recipe.id, ingredients);
  return recipe;
}

/** Updates only the given fields of an own or shared recipe; given ingredients replace the whole list. */
export async function updateRecipeRow(
  tx: DbTransaction,
  userId: string,
  recipeId: string,
  { ingredients, ...fields }: Partial<RecipeFields>,
) {
  const [recipe] = await tx
    .update(recipes)
    .set({ ...fields, updatedAt: new Date() })
    .where(and(eq(recipes.id, recipeId), accessibleRecipe(userId)))
    .returning({ id: recipes.id });
  if (!recipe)
    throw new ClientSafeError(
      translate({ en: 'Recipe not found.', pl: 'Nie znaleziono przepisu.' }),
    );
  if (ingredients) await replaceRecipeIngredients(tx, recipe.id, ingredients);
  return recipe;
}

export async function updateRecipeRecord(
  userId: string,
  { id, ...fields }: typeof updateRecipeFieldsInputType.infer,
) {
  await db.transaction((tx) => updateRecipeRow(tx, userId, id, fields));
}

/** Creates a recipe without id (defaults fill missing fields) or patches the given fields. */
export async function saveRecipeRecord(
  userId: string,
  { id, ...fields }: typeof saveRecipeInputType.infer,
) {
  if (id) return db.transaction((tx) => updateRecipeRow(tx, userId, id, fields));
  const created = recipeFieldsType(fields);
  if (created instanceof type.errors) throw new ClientSafeError(created.summary);
  return db.transaction((tx) => createRecipeRow(tx, userId, created));
}

export async function updateRecipeRatingRecord(
  userId: string,
  data: typeof updateRecipeRatingInputType.infer,
) {
  await db.transaction((tx) => updateRecipeRow(tx, userId, data.id, { rating: data.rating }));
}
