import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray, or } from 'drizzle-orm';
import { recipeImages, recipes, uploadObjects, userSharingSettings } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { getSessionUserId, requireSession } from '@/server/getSession.server';
import { getSharingFriendsIds } from '@/server/getSharingFriendsIds.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { storagePathToUrl } from '@/server/storage/config.server';
import { getRecipeIngredients } from './recipeIngredients.server';
import { type Nutrition, type RecipeIngredient, sumIngredientNutrition } from './recipeNutrition';
import { updateRecipeRatingRecord } from './recipes.server';
import { updateRecipeRatingInputType } from './recipes.validation';

type RecipeSelect = typeof recipes.$inferSelect;

export type RecipeLibraryItem = Omit<RecipeSelect, 'createdAt' | 'updatedAt' | 'userId'> & {
  createdAt: string;
  images: RecipeImage[];
  ingredients: RecipeIngredient[];
  isOwned: boolean;
  /** Whole-recipe nutrition of the linked ingredients; null when none has nutrition. */
  nutrition: Nutrition | null;
  updatedAt: string;
};

export type RecipeImage = { id: string; url: string };

export type RecipeViewItem = RecipeLibraryItem & { canManage: boolean };

export const getRecipeLibrary = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeLibrary')])
  .handler(async () => {
    const userId = await getSessionUserId();

    if (!userId) {
      return [];
    }

    const sharingFriendIds = getSharingFriendsIds(userId, userSharingSettings.shareRecipes);

    const recipeRows = await db
      .select()
      .from(recipes)
      .where(or(eq(recipes.userId, userId), inArray(recipes.userId, sharingFriendIds)));

    const related = await getRecipeRelations(recipeRows.map((recipe) => recipe.id));
    return recipeRows
      .map((recipe) => toRecipeLibraryItem(recipe, related, recipe.userId === userId))
      .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  });

const recipeByIdInputType = type({ id: 'string.uuid' });

export const getRecipeById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeById')])
  .validator(arkTypeValidator(recipeByIdInputType))
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();

    if (!userId) {
      return null;
    }

    const sharingFriendIds = getSharingFriendsIds(userId, userSharingSettings.shareRecipes);

    const [recipe] = await db
      .select()
      .from(recipes)
      .where(
        and(
          eq(recipes.id, data.id),
          or(eq(recipes.userId, userId), inArray(recipes.userId, sharingFriendIds)),
        ),
      )
      .limit(1);

    if (!recipe) {
      return null;
    }

    const related = await getRecipeRelations([recipe.id]);

    return {
      ...toRecipeLibraryItem(recipe, related, recipe.userId === userId),
      canManage: recipe.userId === userId,
    } satisfies RecipeViewItem;
  });

export const getOwnedRecipeById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getOwnedRecipeById')])
  .validator(arkTypeValidator(recipeByIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const recipeRows = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, data.id), eq(recipes.userId, session.user.id)))
      .limit(1);
    const recipe = recipeRows[0];

    if (!recipe) {
      return null;
    }

    const related = await getRecipeRelations([recipe.id]);

    return toRecipeLibraryItem(recipe, related, true);
  });

export const updateRecipeRating = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateRecipeRating')])
  .validator(arkTypeValidator(updateRecipeRatingInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    await updateRecipeRatingRecord(session.user.id, data);

    return { ok: true };
  });

async function getImagesByRecipeId(recipeIds: string[]) {
  const imagesByRecipeId = new Map<string, RecipeImage[]>();

  if (recipeIds.length === 0) {
    return imagesByRecipeId;
  }

  const rows = await db
    .select({
      id: recipeImages.id,
      key: uploadObjects.key,
      position: recipeImages.position,
      recipeId: recipeImages.recipeId,
    })
    .from(recipeImages)
    .innerJoin(uploadObjects, eq(uploadObjects.id, recipeImages.uploadObjectId))
    .where(inArray(recipeImages.recipeId, recipeIds))
    .orderBy(recipeImages.position);

  for (const row of rows) {
    const url = storagePathToUrl(row.key);

    if (!url) {
      continue;
    }

    const images = imagesByRecipeId.get(row.recipeId) ?? [];
    images.push({ id: row.id, url });
    imagesByRecipeId.set(row.recipeId, images);
  }

  return imagesByRecipeId;
}

/** Loads images and ingredients of the given recipes together. */
async function getRecipeRelations(recipeIds: string[]) {
  const [images, ingredients] = await Promise.all([
    getImagesByRecipeId(recipeIds),
    getRecipeIngredients(recipeIds),
  ]);
  return { images, ingredients };
}

function toRecipeLibraryItem(
  { userId: _userId, ...recipe }: RecipeSelect,
  related: Awaited<ReturnType<typeof getRecipeRelations>>,
  isOwned: boolean,
): RecipeLibraryItem {
  const ingredients = related.ingredients.get(recipe.id) ?? [];
  return {
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
    images: related.images.get(recipe.id) ?? [],
    ingredients,
    isOwned,
    nutrition: sumIngredientNutrition(ingredients),
    updatedAt: recipe.updatedAt.toISOString(),
  };
}
