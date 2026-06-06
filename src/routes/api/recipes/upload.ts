import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { type } from 'arktype';
import sharp from 'sharp';
import { createFileRoute } from '@tanstack/react-router';
import { auth } from '@/lib/auth/auth';
import { log } from '@/lib/logger';

const TEMP_IMAGE_DIRECTORY = path.join(process.cwd(), '_temp', 'recipe-images');

const uploadRecipeInputType = type({
  carbs: 'null | string.trim |> string.numeric.parse',
  description: 'string.trim',
  fats: 'null | string.trim |> string.numeric.parse',
  ingredients: 'string[]',
  kcal: 'null | string.trim |> string.numeric.parse',
  name: 'string.trim |> string >= 1',
  photos: 'File[]',
  protein: 'null | string.trim |> string.numeric.parse',
  rating: 'null | string.trim |> string.numeric.parse',
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

          const images = await Promise.all(
            validation.photos.map((file) => saveOptimizedImage(file)),
          );

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

          return Response.json(
            {
              error: error instanceof Error ? error.message : 'Recipe upload failed',
            },
            { status: 500 },
          );
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

  await sharp(input)
    .rotate()
    .resize({
      fit: 'inside',
      height: 720,
      width: 720,
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toFile(outputPath);

  return {
    originalName: file.name,
    path: outputPath,
    type: 'image/webp',
  };
}
