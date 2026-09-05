import { randomUUID } from 'node:crypto';
import { ArkErrors, type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createMiddleware, createServerFn } from '@tanstack/react-start';
import { recipeImages, recipes, uploadObjects } from '@veles/db/schema';
import { db } from '@/lib/db';
import { requireSession } from '@/lib/auth/getSession';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { logMiddleware } from '@/lib/middleware/logMiddleware';
import { getStorageConfig } from '@/lib/storage/config';
import { optimizeImage } from '@/lib/storage/image';
import { IMAGE_MAX_INPUT_BYTES } from '@/lib/storage/imageLimits';
import { deleteFileByKey, uploadFileByKey } from '@/lib/storage/r2';
// Keep below nginx's client_max_body_size with enough headroom for multipart form overhead.
// If this changes, update the corresponding limit in infra/nginx/nginx.conf.
const RECIPE_UPLOAD_MAX_REQUEST_BYTES = 85 * 1024 * 1024;

export const RECIPE_UPLOAD_MAX_PHOTO_COUNT = 8;
export const RECIPE_UPLOAD_MAX_PHOTO_BYTES = IMAGE_MAX_INPUT_BYTES;

const contentLengthType = type('string.numeric.parse |> number.integer >= 0');
const formDataType = type('FormData');
const photoCountType = type(`File[] <= ${RECIPE_UPLOAD_MAX_PHOTO_COUNT}`);
const photoSizeType = type('File[]').narrow((files, context) =>
  files.every((file) => file.size <= RECIPE_UPLOAD_MAX_PHOTO_BYTES)
    ? true
    : context.mustBe('photos no larger than 10 MiB each'),
);

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
  photos: 'File[]',
  portions: portionsFormValueType,
  protein: optionalNumericFormValueType,
  rating: optionalRatingFormValueType,
  tags: recipeTextListType,
});

const limitRecipeUploadRequestMiddleware = createMiddleware().server(async ({ next, request }) => {
  const contentLength = contentLengthType(request.headers.get('content-length') ?? '');

  if (contentLength instanceof type.errors || contentLength > RECIPE_UPLOAD_MAX_REQUEST_BYTES) {
    throw new ClientSafeError('Upload request is too large.');
  }

  return next();
});

export const createRecipe = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createRecipe'), limitRecipeUploadRequestMiddleware])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return persistRecipeUpload(data, session.user.id);
  });

/** Validates, stores, and records one recipe while cleaning up uploaded files after any failure. */
async function persistRecipeUpload(formData: FormData, userId: string) {
  const uploadedKeys: string[] = [];

  try {
    const validation = validateRecipeForm(formData);
    const optimizedImages: Array<{ id: string; key: string; type: string }> = [];

    for (const file of validation.photos) {
      const optimizedImage = await optimizeImage(file);
      const image = {
        id: randomUUID(),
        key: `recipe-images/${randomUUID()}.webp`,
        type: optimizedImage.type,
      };

      await uploadFileByKey({
        body: optimizedImage.buffer,
        contentType: optimizedImage.type,
        key: image.key,
        bucket: 'public',
      });
      uploadedKeys.push(image.key);
      optimizedImages.push(image);
    }

    const { bucketName } = getStorageConfig();

    const recipeId = await db.transaction(async (tx) => {
      const insertedRecipes = await tx
        .insert(recipes)
        .values({
          carbs: validation.carbs,
          description: validation.description,
          fats: validation.fats,
          ingredients: validation.ingredients,
          kcal: validation.kcal,
          name: validation.name,
          portions: validation.portions,
          protein: validation.protein,
          rating: validation.rating,
          tags: validation.tags,
          userId,
        })
        .returning({ id: recipes.id });
      const recipe = insertedRecipes[0];

      if (!recipe) {
        throw new Error('Recipe insert failed');
      }

      if (optimizedImages.length > 0) {
        await tx.insert(uploadObjects).values(
          optimizedImages.map((image) => ({
            bucket: bucketName,
            id: image.id,
            key: image.key,
            mimeType: image.type,
            userId,
          })),
        );

        await tx.insert(recipeImages).values(
          optimizedImages.map((image, position) => ({
            position,
            recipeId: recipe.id,
            uploadObjectId: image.id,
          })),
        );
      }

      return recipe.id;
    });

    return { id: recipeId };
  } catch (error) {
    await Promise.allSettled(uploadedKeys.map((key) => deleteFileByKey(key, 'public')));
    throw error;
  }
}

/** Extracts upload fields and turns valid form values into the recipe persistence shape. */
function validateRecipeForm(formData: FormData) {
  const photos = formData
    .getAll('photos')
    .filter((value): value is File => value instanceof File && value.size > 0);
  const photoCountValidation = photoCountType(photos);

  if (photoCountValidation instanceof type.errors) {
    throw new ClientSafeError('Too many photos.');
  }

  const photoSizeValidation = photoSizeType(photoCountValidation);

  if (photoSizeValidation instanceof type.errors) {
    throw new ClientSafeError('A photo is too large.');
  }

  const ingredientsValue = formData.get('ingredients');
  const tagsValue = formData.get('tags');
  const validation = uploadRecipeInputType({
    carbs: formData.get('carbs'),
    description: formData.get('description'),
    fats: formData.get('fats'),
    ingredients: typeof ingredientsValue === 'string' ? ingredientsValue.split('\n') : [],
    kcal: formData.get('kcal'),
    name: formData.get('name'),
    photos: photoSizeValidation,
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
