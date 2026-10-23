import { ArkErrors, type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { recipeImages, uploadObjects } from '@veles/db/schema';
import type { DbTransaction } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { limitRequestSizeMiddleware } from '@/server/middleware/limitRequestSizeMiddleware';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { type PhotoLinkTable, persistWithPhotos } from '@/server/storage/photoSync.server';
import { createRecipeRow, updateRecipeRow } from './recipes.server';
import { recipeFieldsType } from './recipes.validation';
import { translate } from '@/lib/i18n/getLocale';

const RECIPE_IMAGE_KEY_PREFIX = 'recipe-images';

export const RECIPE_PHOTO_MAX_COUNT = 8;

const formDataType = type('FormData');
const recipeIdType = type('string.uuid');

const optionalRatingFormValueType = type('string.trim').pipe((value): number | null | ArkErrors =>
  value === '' ? null : type('string.numeric.parse |> 1 <= number <= 5')(value),
);

const portionsFormValueType = type('string.trim').pipe((value): number | ArkErrors =>
  type('string.numeric.parse |> number.integer >= 1')(value),
);

/** Text fields come from the form; `ingredients` is the editor's JSON list. */
const uploadRecipeInputType = type({
  description: 'string.trim',
  ingredients: type('string.json.parse').to(recipeFieldsType.get('ingredients')),
  name: 'string.trim |> string >= 1',
  portions: portionsFormValueType,
  rating: optionalRatingFormValueType,
});

export const createRecipe = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createRecipe'), limitRequestSizeMiddleware()])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return persistRecipeUpload(data, session.user.id);
  });

export const updateRecipe = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateRecipe'), limitRequestSizeMiddleware()])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const recipeId = recipeIdType(data.get('id'));

    if (recipeId instanceof type.errors) {
      throw new ClientSafeError(
        translate({ en: 'Recipe not found.', pl: 'Nie znaleziono przepisu.' }),
      );
    }

    return persistRecipeUpload(data, session.user.id, recipeId);
  });

/** Validates fields, then creates or updates the recipe and rewrites its image links together. */
async function persistRecipeUpload(formData: FormData, userId: string, existingRecipeId?: string) {
  const fields = validateRecipeFields(formData);

  return persistWithPhotos(
    { formData, keyPrefix: RECIPE_IMAGE_KEY_PREFIX, maxCount: RECIPE_PHOTO_MAX_COUNT, userId },
    async (tx, photos) => {
      const recipe = existingRecipeId
        ? await updateRecipeRow(tx, userId, existingRecipeId, fields)
        : await createRecipeRow(tx, userId, fields);

      await photos.sync(recipeImageLinks(tx, recipe.id));

      return { id: recipe.id };
    },
  );
}

function recipeImageLinks(tx: DbTransaction, recipeId: string): PhotoLinkTable {
  return {
    deleteAll: () => tx.delete(recipeImages).where(eq(recipeImages.recipeId, recipeId)),
    insert: (links) => tx.insert(recipeImages).values(links.map((link) => ({ ...link, recipeId }))),
    selectStored: () =>
      tx
        .select({
          createdAt: recipeImages.createdAt,
          id: recipeImages.id,
          key: uploadObjects.key,
          uploadObjectId: recipeImages.uploadObjectId,
        })
        .from(recipeImages)
        .innerJoin(uploadObjects, eq(uploadObjects.id, recipeImages.uploadObjectId))
        .where(eq(recipeImages.recipeId, recipeId)),
  };
}

/** Turns recipe form fields into the recipe persistence shape. */
function validateRecipeFields(formData: FormData) {
  const validation = uploadRecipeInputType({
    description: formData.get('description'),
    ingredients: formData.get('ingredients') ?? '[]',
    name: formData.get('name'),
    portions: formData.get('portions'),
    rating: formData.get('rating'),
  });

  if (validation instanceof type.errors) {
    throw new ClientSafeError(validation.summary);
  }

  return validation;
}
