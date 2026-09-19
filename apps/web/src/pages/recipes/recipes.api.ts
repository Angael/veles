import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray, or } from 'drizzle-orm';
import {
  recipeImages,
  recipes,
  uploadObjects,
  userConnections,
  userSharingSettings,
} from '@veles/db/schema';
import { db } from '@/server/db.server';
import { getSessionUserId, requireSession } from '@/server/getSession.server';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { storagePathToUrl } from '@/server/storage/config.server';

type RecipeSelect = typeof recipes.$inferSelect;

export type RecipeLibraryItem = Omit<RecipeSelect, 'createdAt' | 'updatedAt' | 'userId'> & {
  createdAt: string;
  images: Array<{ url: string }>;
  isOwned: boolean;
  updatedAt: string;
};

export type RecipeViewItem = RecipeLibraryItem & { canManage: boolean };

export const getRecipeLibrary = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeLibrary')])
  .handler(async () => {
    const userId = await getSessionUserId();

    if (!userId) {
      return [];
    }

    const recipeRows = await db
      .select({
        carbs: recipes.carbs,
        createdAt: recipes.createdAt,
        description: recipes.description,
        fats: recipes.fats,
        id: recipes.id,
        ingredients: recipes.ingredients,
        ownerUserId: recipes.userId,
        kcal: recipes.kcal,
        name: recipes.name,
        protein: recipes.protein,
        portions: recipes.portions,
        rating: recipes.rating,
        tags: recipes.tags,
        updatedAt: recipes.updatedAt,
      })
      .from(recipes)
      .leftJoin(userSharingSettings, eq(userSharingSettings.userId, recipes.userId))
      .leftJoin(
        userConnections,
        or(
          and(
            eq(userConnections.userLowId, userId),
            eq(userConnections.userHighId, recipes.userId),
          ),
          and(
            eq(userConnections.userHighId, userId),
            eq(userConnections.userLowId, recipes.userId),
          ),
        ),
      )
      .where(
        or(
          eq(recipes.userId, userId),
          and(eq(userSharingSettings.shareRecipes, true), recipeConnectionPredicate(userId)),
        ),
      );

    const imagesByRecipeId = await getImagesByRecipeId(recipeRows.map((recipe) => recipe.id));
    return recipeRows
      .map((recipe): RecipeLibraryItem => ({
        carbs: recipe.carbs,
        createdAt: recipe.createdAt.toISOString(),
        description: recipe.description,
        fats: recipe.fats,
        id: recipe.id,
        images: imagesByRecipeId.get(recipe.id) ?? [],
        isOwned: recipe.ownerUserId === userId,
        ingredients: recipe.ingredients,
        kcal: recipe.kcal,
        name: recipe.name,
        portions: recipe.portions,
        protein: recipe.protein,
        rating: recipe.rating,
        tags: recipe.tags,
        updatedAt: recipe.updatedAt.toISOString(),
      }))
      .toSorted((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  });

const recipeByIdInputType = type({ id: 'string.uuid' });

const updateRecipeRatingInputType = type({
  id: 'string.uuid',
  rating: '1 <= number.integer <= 5',
});

const recipeTextListType = type('string.trim[]').pipe((values) => values.filter(Boolean));

const updateRecipeInputType = type({
  carbs: 'number.integer >= 0 | null',
  description: 'string.trim',
  fats: 'number.integer >= 0 | null',
  id: 'string.uuid',
  ingredients: recipeTextListType,
  kcal: 'number.integer >= 0 | null',
  name: 'string.trim |> string >= 1',
  portions: 'number.integer >= 1',
  protein: 'number.integer >= 0 | null',
  rating: '1 <= number.integer <= 5 | null',
  tags: recipeTextListType,
});

export type UpdateRecipeInput = typeof updateRecipeInputType.infer;

export const getRecipeById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeById')])
  .validator(arkTypeValidator(recipeByIdInputType))
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();

    if (!userId) {
      return null;
    }

    const recipeRows = await db
      .select({ recipe: recipes })
      .from(recipes)
      .leftJoin(userSharingSettings, eq(userSharingSettings.userId, recipes.userId))
      .leftJoin(
        userConnections,
        or(
          and(
            eq(userConnections.userLowId, userId),
            eq(userConnections.userHighId, recipes.userId),
          ),
          and(
            eq(userConnections.userHighId, userId),
            eq(userConnections.userLowId, recipes.userId),
          ),
        ),
      )
      .where(
        and(
          eq(recipes.id, data.id),
          or(
            eq(recipes.userId, userId),
            and(eq(userSharingSettings.shareRecipes, true), recipeConnectionPredicate(userId)),
          ),
        ),
      )
      .limit(1);
    const recipe = recipeRows[0]?.recipe;

    if (!recipe) {
      return null;
    }

    const imagesByRecipeId = await getImagesByRecipeId([recipe.id]);

    return {
      ...toRecipeLibraryItem(recipe, imagesByRecipeId, recipe.userId === userId),
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

    const imagesByRecipeId = await getImagesByRecipeId([recipe.id]);

    return toRecipeLibraryItem(recipe, imagesByRecipeId, true);
  });

export const updateRecipeRating = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateRecipeRating')])
  .validator(arkTypeValidator(updateRecipeRatingInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const updatedRows = await db
      .update(recipes)
      .set({ rating: data.rating, updatedAt: new Date() })
      .where(and(eq(recipes.id, data.id), eq(recipes.userId, session.user.id)))
      .returning({ id: recipes.id });

    if (!updatedRows[0]) {
      throw new ClientSafeError('Recipe not found.');
    }

    return { ok: true };
  });

export const updateRecipe = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateRecipe')])
  .validator(arkTypeValidator(updateRecipeInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const updatedRows = await db
      .update(recipes)
      .set({
        carbs: data.carbs,
        description: data.description,
        fats: data.fats,
        ingredients: data.ingredients,
        kcal: data.kcal,
        name: data.name,
        portions: data.portions,
        protein: data.protein,
        rating: data.rating,
        tags: data.tags,
        updatedAt: new Date(),
      })
      .where(and(eq(recipes.id, data.id), eq(recipes.userId, session.user.id)))
      .returning({ id: recipes.id });

    if (!updatedRows[0]) {
      throw new ClientSafeError('Recipe not found.');
    }

    return { ok: true };
  });

async function getImagesByRecipeId(recipeIds: string[]) {
  const imagesByRecipeId = new Map<string, Array<{ url: string }>>();

  if (recipeIds.length === 0) {
    return imagesByRecipeId;
  }

  const rows = await db
    .select({
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
    images.push({ url });
    imagesByRecipeId.set(row.recipeId, images);
  }

  return imagesByRecipeId;
}

function recipeConnectionPredicate(userId: string) {
  return or(eq(userConnections.userLowId, userId), eq(userConnections.userHighId, userId));
}

function toRecipeLibraryItem(
  recipe: RecipeSelect,
  imagesByRecipeId: Map<string, Array<{ url: string }>>,
  isOwned: boolean,
): RecipeLibraryItem {
  return {
    carbs: recipe.carbs,
    createdAt: recipe.createdAt.toISOString(),
    description: recipe.description,
    fats: recipe.fats,
    id: recipe.id,
    images: imagesByRecipeId.get(recipe.id) ?? [],
    isOwned,
    ingredients: recipe.ingredients,
    kcal: recipe.kcal,
    name: recipe.name,
    portions: recipe.portions,
    protein: recipe.protein,
    rating: recipe.rating,
    tags: recipe.tags,
    updatedAt: recipe.updatedAt.toISOString(),
  };
}
