import { randomUUID } from 'node:crypto';
import { type } from 'arktype';
import sharp from 'sharp';
import { createFileRoute } from '@tanstack/react-router';
import { db } from '@/db';
import { recipeImages, recipes, uploadObjects } from '@/db/schema';
import { auth } from '@/lib/auth/auth';
import { log } from '@/lib/logger';
import { logMiddleware } from '@/lib/middleware/logMiddleware';
import {
  exceedsRecipeUploadRequestLimit,
  parseRecipeUploadForm,
  RECIPE_UPLOAD_MAX_PHOTO_BYTES,
  RECIPE_UPLOAD_MAX_PHOTO_COUNT,
} from '@/pages/recipes/recipeUploadInput';
import { getStorageConfig } from '@/lib/storage/config';
import { deleteFileByKey, uploadFileByKey } from '@/lib/storage/r2';

export const Route = createFileRoute('/api/recipes/upload')({
  server: {
    middleware: [logMiddleware('POST /recipes/upload')],
    handlers: {
      POST: async ({ request }) => {
        const uploadedKeys: string[] = [];

        try {
          const session = await auth.api.getSession({ headers: request.headers });

          if (!session?.user.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          if (exceedsRecipeUploadRequestLimit(request.headers.get('content-length'))) {
            return Response.json({ error: 'Upload request too large' }, { status: 413 });
          }

          const formData = await request.formData();
          const files = formData
            .getAll('photos')
            .filter((value): value is File => value instanceof File && value.size > 0);

          if (files.length > RECIPE_UPLOAD_MAX_PHOTO_COUNT) {
            return Response.json({ error: `Too many photos.` }, { status: 400 });
          }

          if (files.some((file) => file.size > RECIPE_UPLOAD_MAX_PHOTO_BYTES)) {
            return Response.json({ error: `File too large` }, { status: 400 });
          }

          const validation = parseRecipeUploadForm(formData, files);

          if (validation instanceof type.errors) {
            return Response.json(
              { error: validation.summary ?? 'Invalid upload input' },
              { status: 400 },
            );
          }

          const optimizedImages: Array<{ id: string; key: string; type: string }> = [];

          for (const file of validation.photos) {
            const optimizedImage = await optimizeImage(file);
            const image = {
              id: randomUUID(),
              key: `recipe-images/${session.user.id}/${randomUUID()}.webp`,
              type: optimizedImage.type,
            };

            await uploadFileByKey({
              body: optimizedImage.buffer,
              contentType: optimizedImage.type,
              key: image.key,
            });
            uploadedKeys.push(image.key);
            optimizedImages.push(image);
          }

          const { bucketName } = getStorageConfig();

          if (!bucketName) {
            throw new Error('R2 bucket is not configured');
          }

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
                userId: session.user.id,
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
                  userId: session.user.id,
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

          return Response.json({ id: recipeId, ok: true });
        } catch (error) {
          await Promise.allSettled(uploadedKeys.map((key) => deleteFileByKey(key)));
          const status = error instanceof ImageOptimizationError ? 400 : 500;

          log.error('recipe upload error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : undefined,
            stack: error instanceof Error ? error.stack?.split('\n') : undefined,
          });

          return Response.json({ error: 'Recipe upload failed' }, { status });
        }
      },
    },
  },
});

async function optimizeImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new ImageOptimizationError(`Unsupported file type for ${file.name}`);
  }

  const input = Buffer.from(await file.arrayBuffer());

  try {
    const buffer = await sharp(input, { failOn: 'none' })
      .rotate()
      .resize({
        fit: 'inside',
        height: 720,
        width: 720,
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();

    return {
      buffer,
      originalName: file.name,
      type: 'image/webp',
    };
  } catch (error) {
    log.error('Failed to optimize image', {
      errorMsg: error instanceof Error ? error.message : 'Unknown error',
      fileName: file.name,
      stack: error instanceof Error ? error.stack?.split('\n') : undefined,
    });

    throw new ImageOptimizationError('Failed to optimize image');
  }
}

class ImageOptimizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageOptimizationError';
  }
}
