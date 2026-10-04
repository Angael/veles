import { ArkErrors, type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, eq, inArray } from 'drizzle-orm';
import { recipeImages, recipes, uploadObjects } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { readOrderedPhotos } from '@/lib/storage/orderedPhotos';
import { limitRequestSizeMiddleware } from '@/server/middleware/limitRequestSizeMiddleware';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { IMAGE_MAX_INPUT_BYTES } from '@/lib/storage/imageLimits';
import {
  deleteImageFiles,
  planPhotoSync,
  toUploadObjectRows,
  uploadOptimizedImages,
} from '@/server/storage/photoSync.server';
// Keep below nginx's client_max_body_size with enough headroom for multipart form overhead.
// If this changes, update the corresponding limit in infra/nginx/nginx.conf.
const RECIPE_UPLOAD_MAX_REQUEST_BYTES = 85 * 1024 * 1024;
const RECIPE_IMAGE_KEY_PREFIX = 'recipe-images';

export const RECIPE_UPLOAD_MAX_PHOTO_COUNT = 8;
export const RECIPE_UPLOAD_MAX_PHOTO_BYTES = IMAGE_MAX_INPUT_BYTES;

const formDataType = type('FormData');
const recipeIdType = type('string.uuid');

const optionalNumericFormValueType = type('string.trim').pipe((value): number | null | ArkErrors =>
  value === '' ? null : type('string.numeric.parse')(value),
);

const optionalRatingFormValueType = type('string.trim').pipe((value): number | null | ArkErrors =>
  value === '' ? null : type('string.numeric.parse |> 1 <= number <= 5')(value),
);

const portionsFormValueType = type('string.trim').pipe((value): number | ArkErrors =>
  type('string.numeric.parse |> number.integer >= 1')(value),
);

const recipeTextListType = type('string.trim[]').pipe((values) => values.filter(Boolean));

const uploadRecipeInputType = type({
  carbs: optionalNumericFormValueType,
  description: 'string.trim',
  fats: optionalNumericFormValueType,
  ingredients: recipeTextListType,
  kcal: optionalNumericFormValueType,
  name: 'string.trim |> string >= 1',
  portions: portionsFormValueType,
  protein: optionalNumericFormValueType,
  rating: optionalRatingFormValueType,
  tags: recipeTextListType,
});

export const createRecipe = createServerFn({ method: 'POST' })
  .middleware([
    logMiddleware('createRecipe'),
    limitRequestSizeMiddleware(RECIPE_UPLOAD_MAX_REQUEST_BYTES),
  ])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return persistRecipeUpload(data, session.user.id);
  });

export const updateRecipe = createServerFn({ method: 'POST' })
  .middleware([
    logMiddleware('updateRecipe'),
    limitRequestSizeMiddleware(RECIPE_UPLOAD_MAX_REQUEST_BYTES),
  ])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const recipeId = recipeIdType(data.get('id'));

    if (recipeId instanceof type.errors) {
      throw new ClientSafeError('Recipe not found.');
    }

    return persistRecipeUpload(data, session.user.id, recipeId);
  });

/**
 * Validates fields and the ordered photo list, uploads new files, then creates or updates the
 * recipe and rewrites its image links in one transaction. Uploads are cleaned up after any
 * failure; images dropped from the list are deleted from storage after commit.
 */
async function persistRecipeUpload(formData: FormData, userId: string, existingRecipeId?: string) {
  const fields = validateRecipeFields(formData);
  const order = readOrderedPhotos(formData, {
    maxBytes: RECIPE_UPLOAD_MAX_PHOTO_BYTES,
    maxCount: RECIPE_UPLOAD_MAX_PHOTO_COUNT,
  });
  const uploaded = await uploadOptimizedImages(
    order.flatMap((slot) => (slot.kind === 'file' ? [slot.file] : [])),
    RECIPE_IMAGE_KEY_PREFIX,
  );
  let result: { id: string; removedKeys: string[] };

  try {
    result = await db.transaction(async (tx) => {
      const [recipe] = existingRecipeId
        ? await tx
            .update(recipes)
            .set({ ...fields, updatedAt: new Date() })
            .where(and(eq(recipes.id, existingRecipeId), eq(recipes.userId, userId)))
            .returning({ id: recipes.id })
        : await tx
            .insert(recipes)
            .values({ ...fields, userId })
            .returning({ id: recipes.id });

      if (!recipe) {
        throw new ClientSafeError('Recipe not found.');
      }

      const stored = await tx
        .select({
          createdAt: recipeImages.createdAt,
          id: recipeImages.id,
          key: uploadObjects.key,
          uploadObjectId: recipeImages.uploadObjectId,
        })
        .from(recipeImages)
        .innerJoin(uploadObjects, eq(uploadObjects.id, recipeImages.uploadObjectId))
        .where(eq(recipeImages.recipeId, recipe.id));
      const plan = planPhotoSync(order, stored, uploaded);

      // Re-inserting links sidesteps the unique (recipe, position) index while reordering.
      await tx.delete(recipeImages).where(eq(recipeImages.recipeId, recipe.id));

      if (plan.removed.length > 0) {
        await tx.delete(uploadObjects).where(
          inArray(
            uploadObjects.id,
            plan.removed.map((link) => link.uploadObjectId),
          ),
        );
      }

      if (uploaded.length > 0) {
        await tx.insert(uploadObjects).values(toUploadObjectRows(uploaded, userId));
      }

      if (plan.links.length > 0) {
        await tx
          .insert(recipeImages)
          .values(plan.links.map((link) => ({ ...link, recipeId: recipe.id })));
      }

      return { id: recipe.id, removedKeys: plan.removed.map((link) => link.key) };
    });
  } catch (error) {
    await deleteImageFiles(uploaded.map((image) => image.key));
    throw error;
  }

  await deleteImageFiles(result.removedKeys);

  return { id: result.id };
}

/** Turns recipe form fields into the recipe persistence shape. */
function validateRecipeFields(formData: FormData) {
  const ingredientsValue = formData.get('ingredients');
  const tagsValue = formData.get('tags');
  const validation = uploadRecipeInputType({
    carbs: formData.get('carbs'),
    description: formData.get('description'),
    fats: formData.get('fats'),
    ingredients: typeof ingredientsValue === 'string' ? ingredientsValue.split('\n') : [],
    kcal: formData.get('kcal'),
    name: formData.get('name'),
    portions: formData.get('portions'),
    protein: formData.get('protein'),
    rating: formData.get('rating'),
    tags: typeof tagsValue === 'string' ? tagsValue.split(',') : [],
  });

  if (validation instanceof type.errors) {
    throw new ClientSafeError(validation.summary);
  }

  return validation;
}
