import { randomUUID } from 'node:crypto';
import { inArray } from 'drizzle-orm';
import { uploadObjects } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import type { PhotoOrderSlot } from '@/lib/storage/orderedPhotos';
import { db, type DbTransaction } from '@/server/db.server';
import { log } from '@/server/logger.server';
import { getStorageConfig } from './config.server';
import { optimizeImage } from './image.server';
import { deleteFileByKey, uploadFileByKey } from './r2.server';

type UploadedImage = { id: string; key: string; mimeType: string };

/** A photo link row joined with its upload object, as currently stored for one parent. */
type StoredPhotoLink = { createdAt: Date; id: string; key: string; uploadObjectId: string };

/** Link row to insert; kept photos carry their old id and createdAt. */
type PhotoLinkRow = ReturnType<typeof planPhotoSync>['links'][number];

/**
 * The only feature-specific part of photo saving: queries against one link table
 * (recipe_image, weight_entry_photo, ...) scoped to one parent.
 */
export type PhotoLinkTable = {
  deleteAll: () => Promise<unknown>;
  insert: (links: PhotoLinkRow[]) => Promise<unknown>;
  selectStored: () => Promise<StoredPhotoLink[]>;
};

type SyncPhotosOptions = {
  maxCount: number;
  /** `append` keeps the stored photos first and adds the submitted ones after them. */
  mode?: 'append' | 'replace';
};

type PhotoSyncer = {
  sync: (links: PhotoLinkTable, options: SyncPhotosOptions) => Promise<void>;
};

/**
 * Uploads the new files from `order`, then runs `write` in one transaction so the parent row and
 * its photo links change together. New uploads are deleted if anything fails; photos dropped from
 * the list are deleted from storage after commit.
 */
export async function persistWithPhotos<T>(
  { keyPrefix, order, userId }: { keyPrefix: string; order: PhotoOrderSlot[]; userId: string },
  write: (tx: DbTransaction, photos: PhotoSyncer) => Promise<T>,
): Promise<T> {
  const uploaded = await uploadOptimizedImages(
    order.flatMap((slot) => (slot.kind === 'file' ? [slot.file] : [])),
    keyPrefix,
  );
  const removedKeys: string[] = [];
  let result: T;

  try {
    result = await db.transaction((tx) =>
      write(tx, {
        sync: async (links, options) => {
          const removed = await syncPhotoLinks(tx, links, { ...options, order, uploaded, userId });
          removedKeys.push(...removed);
        },
      }),
    );
  } catch (error) {
    await deleteImageFiles(uploaded.map((image) => image.key));
    throw error;
  }

  await deleteImageFiles(removedKeys);

  return result;
}

/**
 * Rewrites a parent's photo links to match the submitted order and records fresh uploads.
 * Returns storage keys of dropped photos so they can be deleted after commit.
 */
async function syncPhotoLinks(
  tx: DbTransaction,
  links: PhotoLinkTable,
  {
    maxCount,
    mode = 'replace',
    order,
    uploaded,
    userId,
  }: SyncPhotosOptions & { order: PhotoOrderSlot[]; uploaded: UploadedImage[]; userId: string },
) {
  const stored = await links.selectStored();
  const fullOrder: PhotoOrderSlot[] =
    mode === 'append'
      ? [...stored.map((link): PhotoOrderSlot => ({ id: link.id, kind: 'stored' })), ...order]
      : order;

  if (fullOrder.length > maxCount) {
    throw new ClientSafeError(`Up to ${maxCount} photos are allowed.`);
  }

  const plan = planPhotoSync(fullOrder, stored, uploaded);

  // Re-inserting links sidesteps the unique (parent, position) index while reordering.
  await links.deleteAll();

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
    await links.insert(plan.links);
  }

  return plan.removed.map((link) => link.key);
}

/**
 * Optimizes and uploads files to the public bucket one by one. Random v4 keys keep objects
 * unguessable. Files uploaded before a failure are removed again.
 */
async function uploadOptimizedImages(files: File[], keyPrefix: string): Promise<UploadedImage[]> {
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
async function deleteImageFiles(keys: string[]) {
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

function toUploadObjectRows(images: UploadedImage[], userId: string) {
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
function planPhotoSync(
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
