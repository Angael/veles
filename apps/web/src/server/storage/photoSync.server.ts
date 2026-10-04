import { randomUUID } from 'node:crypto';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import type { PhotoOrderSlot } from '@/lib/storage/orderedPhotos';
import { log } from '@/server/logger.server';
import { getStorageConfig } from './config.server';
import { optimizeImage } from './image.server';
import { deleteFileByKey, uploadFileByKey } from './r2.server';

export type UploadedImage = { id: string; key: string; mimeType: string };

/** A photo link row joined with its upload object, as currently stored for one parent. */
export type StoredPhotoLink = { createdAt: Date; id: string; key: string; uploadObjectId: string };

/**
 * Optimizes and uploads files to the public bucket one by one. Random v4 keys keep objects
 * unguessable. Files uploaded before a failure are removed again.
 */
export async function uploadOptimizedImages(
  files: File[],
  keyPrefix: string,
): Promise<UploadedImage[]> {
  const uploaded: UploadedImage[] = [];

  try {
    for (const file of files) {
      const optimizedImage = await optimizeImage(file);
      const image = {
        id: randomUUID(),
        key: `${keyPrefix}/${randomUUID()}.webp`,
        mimeType: optimizedImage.type,
      };

      await uploadFileByKey({
        body: optimizedImage.buffer,
        bucket: 'public',
        contentType: optimizedImage.type,
        key: image.key,
      });
      uploaded.push(image);
    }
  } catch (error) {
    await deleteImageFiles(uploaded.map((image) => image.key));
    throw error;
  }

  return uploaded;
}

/** Best-effort removal of public objects; failures are only logged so DB changes stay committed. */
export async function deleteImageFiles(keys: string[]) {
  const results = await Promise.allSettled(keys.map((key) => deleteFileByKey(key, 'public')));

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      log.error('Image file delete failed', {
        error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        key: keys[index],
      });
    }
  });
}

export function toUploadObjectRows(images: UploadedImage[], userId: string) {
  const { bucketName } = getStorageConfig();

  return images.map((image) => ({
    bucket: bucketName,
    id: image.id,
    key: image.key,
    mimeType: image.mimeType,
    userId,
  }));
}

/**
 * Maps a submitted photo order onto the parent's stored links and fresh uploads, producing the
 * link rows to re-insert with new positions and the stored photos that were dropped. Unknown ids
 * are rejected so a request can never attach photos owned by another parent.
 */
export function planPhotoSync(
  order: PhotoOrderSlot[],
  stored: StoredPhotoLink[],
  uploaded: UploadedImage[],
) {
  const storedById = new Map(stored.map((link) => [link.id, link]));
  const remainingUploads = uploaded.values();

  const links = order.map((slot, position) => {
    if (slot.kind === 'file') {
      const image = remainingUploads.next().value;

      if (!image) {
        throw new Error('Uploaded image count does not match photo order');
      }

      return { position, uploadObjectId: image.id };
    }

    const link = storedById.get(slot.id);

    if (!link) {
      throw new ClientSafeError('Photos changed since this page loaded. Reload and try again.');
    }

    return {
      createdAt: link.createdAt,
      id: link.id,
      position,
      uploadObjectId: link.uploadObjectId,
    };
  });
  const keptIds = new Set(links.map((link) => link.id));

  return { links, removed: stored.filter((link) => !keptIds.has(link.id)) };
}
