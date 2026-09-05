import { randomUUID } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { uploadObjects } from '@veles/db/schema';
import { db } from '@/lib/db';
import { getStorageConfig, storagePathToUrl } from '@/lib/storage/config';
import { optimizeImage } from '@/lib/storage/image';
import { deleteFileByKey, uploadFileByKey } from '@/lib/storage/r2';

export const FOOD_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export type FoodImageAsset = typeof uploadObjects.$inferSelect;

type FoodImageUploadOptions = {
  userId: string | null;
};

export type PreparedFoodImage = {
  asset: typeof uploadObjects.$inferInsert;
  key: string;
  bucket: string;
};

/** Builds a CDN URL for an image stored in the configured public bucket. */
export function foodImageUrl(asset: FoodImageAsset | undefined): string | null {
  if (!asset) return null;

  const { bucketName } = getStorageConfig();
  return bucketName && asset.bucket === bucketName ? storagePathToUrl(asset.key) : null;
}

/** Loads all referenced assets in one query, preserving missing IDs as absent map entries. */
export async function getFoodImageAssets(ids: Array<string | null | undefined>) {
  const uniqueIds = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const assetsById = new Map<string, FoodImageAsset>();

  if (uniqueIds.length === 0) return assetsById;

  const assets = await db.select().from(uploadObjects).where(inArray(uploadObjects.id, uniqueIds));
  for (const asset of assets) assetsById.set(asset.id, asset);
  return assetsById;
}

/** Optimizes one image and uploads it; callers own DB insertion and rollback. */
export async function prepareFoodImage(
  file: File,
  options: FoodImageUploadOptions,
): Promise<PreparedFoodImage> {
  if (file.size <= 0 || file.size > FOOD_IMAGE_MAX_BYTES) {
    throw new Error('Food image must be no larger than 10 MiB.');
  }

  const optimized = await optimizeImage(file);
  const id = randomUUID();
  const key = `food-images/${randomUUID()}.webp`;
  const { bucketName } = getStorageConfig();

  await uploadFileByKey({
    body: optimized.buffer,
    contentType: optimized.type,
    key,
    bucket: 'public',
  });

  return {
    asset: {
      bucket: bucketName,
      id,
      key,
      mimeType: optimized.type,
      userId: options.userId,
    },
    bucket: bucketName,
    key,
  };
}

export async function deletePreparedFoodImage(image: PreparedFoodImage) {
  await deleteFileByKey(image.key, 'public');
}
