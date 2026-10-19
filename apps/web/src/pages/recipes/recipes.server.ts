import { type } from 'arktype';
import { and, eq } from 'drizzle-orm';
import { recipes } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db, type DbTransaction } from '@/server/db.server';
import {
  recipeFieldsType,
  type saveRecipeInputType,
  type updateRecipeFieldsInputType,
  type updateRecipeRatingInputType,
} from './recipes.validation';
import { translate } from '@/lib/i18n/getLocale';

type Db = typeof db | DbTransaction;
type RecipeFields = typeof recipeFieldsType.infer;

/** Nutrition columns hold whole numbers; only keys present in the patch are returned. */
function roundNutrition(fields: Partial<RecipeFields>) {
  const rounded = { ...fields };
  for (const key of ['kcal', 'protein', 'fats', 'carbs'] as const) {
    const value = fields[key];
    if (value !== undefined) rounded[key] = value === null ? null : Math.round(value);
  }
  return rounded;
}

export async function createRecipeRow(tx: Db, userId: string, fields: RecipeFields) {
  const [recipe] = await tx
    .insert(recipes)
    .values({ ...fields, ...roundNutrition(fields), userId })
    .returning({ id: recipes.id });
  if (!recipe) throw new Error('Recipe insert returned no row.');
  return recipe;
}

/** Updates only the given fields of an owned recipe; images are handled by the caller. */
export async function updateRecipeRow(
  tx: Db,
  userId: string,
  recipeId: string,
  fields: Partial<RecipeFields>,
) {
  const [recipe] = await tx
    .update(recipes)
    .set({ ...roundNutrition(fields), updatedAt: new Date() })
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)))
    .returning({ id: recipes.id });
  if (!recipe)
    throw new ClientSafeError(
      translate({ en: 'Recipe not found.', pl: 'Nie znaleziono przepisu.' }),
    );
  return recipe;
}

export async function createRecipeRecord(userId: string, data: RecipeFields) {
  return createRecipeRow(db, userId, data);
}

export async function updateRecipeRecord(
  userId: string,
  { id, ...fields }: typeof updateRecipeFieldsInputType.infer,
) {
  await updateRecipeRow(db, userId, id, fields);
}

/** Creates a recipe without id (defaults fill missing fields) or patches the given fields. */
export async function saveRecipeRecord(
  userId: string,
  { id, ...fields }: typeof saveRecipeInputType.infer,
) {
  if (id) return updateRecipeRow(db, userId, id, fields);
  const created = recipeFieldsType(fields);
  if (created instanceof type.errors) throw new ClientSafeError(created.summary);
  return createRecipeRow(db, userId, created);
}

export async function updateRecipeRatingRecord(
  userId: string,
  data: typeof updateRecipeRatingInputType.infer,
) {
  await updateRecipeRow(db, userId, data.id, { rating: data.rating });
}
