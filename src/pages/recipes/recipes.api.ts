import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { recipeImages, recipes, uploadObjects } from '@/db/schema';
import { getSessionUserId, requireSession } from '@/lib/auth/getSession';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { logMiddleware } from '@/lib/middleware/logMiddleware';
import { storagePathToUrl } from '@/lib/storage/config';
import { compareRecipeLibraryOrder } from './recipeLibraryOrder';

type RecipeSelect = typeof recipes.$inferSelect;

export type RecipeLibraryItem = Omit<RecipeSelect, 'createdAt' | 'updatedAt' | 'userId'> & {
  createdAt: string;
  images: Array<{ url: string }>;
  updatedAt: string;
};

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
        kcal: recipes.kcal,
        name: recipes.name,
        protein: recipes.protein,
        portions: recipes.portions,
        rating: recipes.rating,
        tags: recipes.tags,
        updatedAt: recipes.updatedAt,
      })
      .from(recipes)
      .where(eq(recipes.userId, userId));

    const imagesByRecipeId = await getImagesByRecipeId(recipeRows.map((recipe) => recipe.id));
    return recipeRows
      .map(
        (recipe): RecipeLibraryItem => ({
          carbs: recipe.carbs,
          createdAt: recipe.createdAt.toISOString(),
          description: recipe.description,
          fats: recipe.fats,
          id: recipe.id,
          images: imagesByRecipeId.get(recipe.id) ?? [],
          ingredients: recipe.ingredients,
          kcal: recipe.kcal,
          name: recipe.name,
          portions: recipe.portions,
          protein: recipe.protein,
          rating: recipe.rating,
          tags: recipe.tags,
          updatedAt: recipe.updatedAt.toISOString(),
        }),
      )
      .sort(compareRecipeLibraryOrder);
  });

const recipeByIdInputType = type({ id: 'string.uuid' });

const updateRecipeRatingInputType = type({
  id: 'string.uuid',
  rating: '1 <= number.integer <= 5',
});

export const getRecipeById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeById')])
  .validator(arkTypeValidator(recipeByIdInputType))
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();

    if (!userId) {
      return null;
    }

    const recipeRows = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, data.id), eq(recipes.userId, userId)))
      .limit(1);
    const recipe = recipeRows[0];

    if (!recipe) {
      return null;
    }

    const imagesByRecipeId = await getImagesByRecipeId([recipe.id]);

    return {
      carbs: recipe.carbs,
      createdAt: recipe.createdAt.toISOString(),
      description: recipe.description,
      fats: recipe.fats,
      id: recipe.id,
      images: imagesByRecipeId.get(recipe.id) ?? [],
      ingredients: recipe.ingredients,
      kcal: recipe.kcal,
      name: recipe.name,
      portions: recipe.portions,
      protein: recipe.protein,
      rating: recipe.rating,
      tags: recipe.tags,
      updatedAt: recipe.updatedAt.toISOString(),
    } satisfies RecipeLibraryItem;
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
