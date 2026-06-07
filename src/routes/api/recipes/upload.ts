import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ArkErrors, type } from 'arktype';
import sharp from 'sharp';
import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@/lib/auth/auth';
import { log } from '@/lib/logger';

const TEMP_IMAGE_DIRECTORY = path.join(process.cwd(), '_temp', 'recipe-images');
const MAX_PHOTO_COUNT = 8;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const optionalNumericFormValueType = type('string.trim').pipe((value): number | null | ArkErrors =>
  value === '' ? null : type('string.numeric.parse')(value),
);

const uploadRecipeInputType = type({
  carbs: optionalNumericFormValueType,
  description: 'string.trim',
  fats: optionalNumericFormValueType,
  ingredients: 'string[]',
  kcal: optionalNumericFormValueType,
  name: 'string.trim |> string >= 1',
  photos: 'File[]',
  protein: optionalNumericFormValueType,
  rating: optionalNumericFormValueType,
  tags: 'string[]',
});

export const Route = createFileRoute('/api/recipes/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const session = await auth.api.getSession({ headers: request.headers });

          if (!session?.user.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
          }

          const formData = await request.formData();
          const files = formData
            .getAll('photos')
            .filter((value): value is File => value instanceof File && value.size > 0);

          if (files.length > MAX_PHOTO_COUNT) {
            return Response.json({ error: `Too many photos.` }, { status: 400 });
          }

          if (files.some((file) => file.size > MAX_PHOTO_BYTES)) {
            return Response.json({ error: `File too large` }, { status: 400 });
          }

          const ingredientsValue = formData.get('ingredients');
          const tagsValue = formData.get('tags');
          const validation = uploadRecipeInputType({
            carbs: formData.get('carbs'),
            description: formData.get('description'),
            fats: formData.get('fats'),
            ingredients:
              typeof ingredientsValue === 'string'
                ? ingredientsValue
                    .split('\n')
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [],
            kcal: formData.get('kcal'),
            name: formData.get('name'),
            photos: files,
            protein: formData.get('protein'),
            rating: formData.get('rating'),
            tags:
              typeof tagsValue === 'string'
                ? tagsValue
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean)
                : [],
          });

          if (validation instanceof type.errors) {
            return Response.json(
              { error: validation.summary ?? 'Invalid upload input' },
              { status: 400 },
            );
          }

          await mkdir(TEMP_IMAGE_DIRECTORY, { recursive: true });

          const images: Awaited<ReturnType<typeof saveOptimizedImage>>[] = [];

          for (const file of validation.photos) {
            const image = await saveOptimizedImage(file);
            images.push(image);

            log.debug('recipe upload image saved', {
              recipeName: validation.name,
              userId: session.user.id,
              image,
            });
          }

          log.info('recipe upload payload', {
            userId: session.user.id,
            recipeName: validation.name,
            images,
          });

          return Response.json({ ok: true });
        } catch (error) {
          log.error('recipe upload error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack?.split('\n') : undefined,
          });

          return Response.json({ error: 'Recipe upload failed' }, { status: 500 });
        }
      },
    },
  },
});

async function saveOptimizedImage(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error(`Unsupported file type for ${file.name}`);
  }

  const input = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.webp`;
  const outputPath = path.join(TEMP_IMAGE_DIRECTORY, filename);

  try {
    await sharp(input, { failOn: 'none' })
      .rotate()
      .resize({
        fit: 'inside',
        height: 720,
        width: 720,
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(outputPath);
  } catch (error) {
    throw new Error(
      `Failed to optimize image ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }

  return {
    originalName: file.name,
    path: outputPath,
    type: 'image/webp',
  };
}
