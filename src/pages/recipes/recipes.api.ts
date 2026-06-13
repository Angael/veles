import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { recipeImages, recipeLastViews, recipes, uploadObjects } from '@/db/schema';
import { auth } from '@/lib/auth/auth';
import { log } from '@/lib/logger';
import { logMiddleware } from '@/lib/middleware/logMiddleware';
import { storagePathToUrl } from '@/lib/storage/config';

type RecipeSelect = typeof recipes.$inferSelect;

export type RecipeLibraryItem = Omit<RecipeSelect, 'createdAt' | 'updatedAt' | 'userId'> & {
  createdAt: string;
  images: Array<{ url: string }>;
  lastViewedAt: string | null;
  updatedAt: string;
};

export type RecipeDetail = RecipeLibraryItem;

export const getRecipeLibrary = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeLibrary')])
  .handler(async () => {
    const session = await getSession();

    if (!session?.user.id) {
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
        lastViewedAt: recipeLastViews.viewedAt,
        name: recipes.name,
        protein: recipes.protein,
        portions: recipes.portions,
        rating: recipes.rating,
        tags: recipes.tags,
        updatedAt: recipes.updatedAt,
      })
      .from(recipes)
      .leftJoin(
        recipeLastViews,
        and(eq(recipeLastViews.recipeId, recipes.id), eq(recipeLastViews.userId, session.user.id)),
      )
      .where(eq(recipes.userId, session.user.id));

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
          lastViewedAt: recipe.lastViewedAt?.toISOString() ?? null,
          name: recipe.name,
          portions: recipe.portions,
          protein: recipe.protein,
          rating: recipe.rating,
          tags: recipe.tags,
          updatedAt: recipe.updatedAt.toISOString(),
        }),
      )
      .sort((left, right) => {
        if (left.lastViewedAt || right.lastViewedAt) {
          return (right.lastViewedAt ?? '').localeCompare(left.lastViewedAt ?? '');
        }

        return right.updatedAt.localeCompare(left.updatedAt);
      });
  });

const recipeByIdInputType = type({ id: 'string.uuid' });

export const getRecipeById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeById')])
  .inputValidator(arkTypeValidator(recipeByIdInputType))
  .handler(async ({ data }) => {
    const session = await getSession();

    if (!session?.user.id) {
      return null;
    }

    const recipeRows = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, data.id), eq(recipes.userId, session.user.id)))
      .limit(1);
    const recipe = recipeRows[0];

    if (!recipe) {
      return null;
    }

    void db
      .insert(recipeLastViews)
      .values({ recipeId: recipe.id, userId: session.user.id })
      .onConflictDoUpdate({
        set: { viewedAt: sql`now()` },
        target: [recipeLastViews.userId, recipeLastViews.recipeId],
      })
      .catch((error: unknown) => {
        log.error('Failed to update recipe last view', {
          error: error instanceof Error ? error.message : 'Unknown error',
          recipeId: recipe.id,
          userId: session.user.id,
        });
      });

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
      lastViewedAt: new Date().toISOString(),
      name: recipe.name,
      portions: recipe.portions,
      protein: recipe.protein,
      rating: recipe.rating,
      tags: recipe.tags,
      updatedAt: recipe.updatedAt.toISOString(),
    } satisfies RecipeDetail;
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

async function getSession() {
  const headers = getRequestHeaders();

  return auth.api.getSession({ headers });
}
