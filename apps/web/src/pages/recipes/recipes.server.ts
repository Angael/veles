import { type } from 'arktype';
import { and, eq, inArray, or } from 'drizzle-orm';
import { recipeImages, recipes, uploadObjects, userSharingSettings } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db, type DbTransaction } from '@/server/db.server';
import { getSharingFriendsIds } from '@/server/getSharingFriendsIds.server';
import { persistWithPhotos } from '@/server/storage/photoSync.server';
import {
  RECIPE_IMAGE_KEY_PREFIX,
  recipeImageLinks,
  recipePhotosFromUrls,
} from './recipeImages.server';
import { replaceRecipeIngredients } from './recipeIngredients.server';
import {
  RECIPE_PHOTO_MAX_COUNT,
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

/**
 * Agent save: creates a recipe without id (defaults fill missing fields) or patches the given
 * fields. Given `imageUrls` replace the photo list in the same transaction, like the app's form.
 */
export async function saveRecipeRecord(
  userId: string,
  { id, imageUrls, ...fields }: typeof saveRecipeInputType.infer,
) {
  const write = recipeWriter(userId, id, fields);
  if (!imageUrls) return db.transaction(write);
  const formData = await recipePhotosFromUrls(
    imageUrls,
    id ? await storedRecipeImages(userId, id) : [],
  );
  return persistWithPhotos(
    { formData, keyPrefix: RECIPE_IMAGE_KEY_PREFIX, maxCount: RECIPE_PHOTO_MAX_COUNT, userId },
    async (tx, photos) => {
      const recipe = await write(tx);
      await photos.sync(recipeImageLinks(tx, recipe.id));
      return { id: recipe.id };
    },
  );
}

/** Validates up front, so a bad create fails before any image is downloaded. */
function recipeWriter(
  userId: string,
  id: string | undefined,
  fields: Omit<typeof saveRecipeInputType.infer, 'id' | 'imageUrls'>,
) {
  if (id) return (tx: DbTransaction) => updateRecipeRow(tx, userId, id, fields);
  const created = recipeFieldsType(fields);
  if (created instanceof type.errors) throw new ClientSafeError(created.summary);
  return (tx: DbTransaction) => createRecipeRow(tx, userId, created);
}

/** Stored photo links of an accessible recipe, to match image URLs the agent read back. */
function storedRecipeImages(userId: string, recipeId: string) {
  return db
    .select({ id: recipeImages.id, key: uploadObjects.key })
    .from(recipeImages)
    .innerJoin(uploadObjects, eq(uploadObjects.id, recipeImages.uploadObjectId))
    .innerJoin(recipes, eq(recipes.id, recipeImages.recipeId))
    .where(and(eq(recipeImages.recipeId, recipeId), accessibleRecipe(userId)));
}

export async function updateRecipeRatingRecord(
  userId: string,
  data: typeof updateRecipeRatingInputType.infer,
) {
  await db.transaction((tx) => updateRecipeRow(tx, userId, data.id, { rating: data.rating }));
}
