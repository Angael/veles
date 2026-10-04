import { randomUUID } from 'node:crypto';
import { type } from 'arktype';
import { inArray } from 'drizzle-orm';
import { uploadObjects } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { IMAGE_MAX_INPUT_BYTES, PHOTOS_FORM_FIELD } from '@/lib/storage/imageLimits';
import { db, type DbTransaction } from '@/server/db.server';
import { log } from '@/server/logger.server';
import { getStorageConfig } from './config.server';
import { optimizeImage } from './image.server';
import { deleteFileByKey, uploadFileByKey } from './r2.server';

/** One submitted photo, in order: a stored photo link id, or a new file to upload. */
type PhotoEntry = string | File;

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

type PhotoSyncer = {
  /** `append` keeps the stored photos first and adds the submitted ones after them. */
  sync: (links: PhotoLinkTable, options?: { mode?: 'append' | 'replace' }) => Promise<void>;
};

const photoEntriesType = type('(string.uuid | File)[]');

/**
 * Saves a form that contains a `PhotosField`. Reads its ordered `photos` entries, uploads the new
 * files, then runs `write` in one transaction so the parent row and its photo links change
 * together; `write` calls `photos.sync` once the parent id is known. New uploads are deleted if
 * anything fails; photos dropped from the list are deleted from storage after commit.
 */
export async function persistWithPhotos<T>(
  {
    formData,
    keyPrefix,
    maxCount,
    userId,
  }: { formData: FormData; keyPrefix: string; maxCount: number; userId: string },
  write: (tx: DbTransaction, photos: PhotoSyncer) => Promise<T>,
): Promise<T> {
  const entries = readPhotoEntries(formData, maxCount);
  const uploaded = await uploadOptimizedImages(
    entries.filter((entry) => entry instanceof File),
    keyPrefix,
  );
  const removedKeys: string[] = [];
  let result: T;

  try {
    result = await db.transaction((tx) =>
      write(tx, {
        sync: async (links, { mode = 'replace' } = {}) => {
          const removed = await syncPhotoLinks(tx, links, {
            entries,
            maxCount,
            mode,
            uploaded,
            userId,
          });
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

/** Validates the ordered `photos` entries written by `PhotosField` against count/size limits. */
function readPhotoEntries(formData: FormData, maxCount: number): PhotoEntry[] {
  const entries = photoEntriesType(formData.getAll(PHOTOS_FORM_FIELD));

  if (entries instanceof type.errors) {
    throw new ClientSafeError('Photos are invalid.');
  }

  const storedIds = entries.filter((entry) => typeof entry === 'string');

  if (new Set(storedIds).size !== storedIds.length) {
    throw new ClientSafeError('Photos are invalid.');
  }

  if (entries.length > maxCount) {
    throw new ClientSafeError(`Up to ${maxCount} photos are allowed.`);
  }

  if (entries.some((entry) => entry instanceof File && entry.size > IMAGE_MAX_INPUT_BYTES)) {
    throw new ClientSafeError('A photo is too large.');
  }

  return entries;
}

/**
 * Rewrites a parent's photo links to match the submitted order and records fresh uploads.
 * Returns storage keys of dropped photos so they can be deleted after commit.
 */
async function syncPhotoLinks(
  tx: DbTransaction,
  links: PhotoLinkTable,
  {
    entries,
    maxCount,
    mode,
    uploaded,
    userId,
  }: {
    entries: PhotoEntry[];
    maxCount: number;
    mode: 'append' | 'replace';
    uploaded: UploadedImage[];
    userId: string;
  },
) {
  const stored = await links.selectStored();
  const fullEntries = mode === 'append' ? [...stored.map((link) => link.id), ...entries] : entries;

  if (fullEntries.length > maxCount) {
    throw new ClientSafeError(`Up to ${maxCount} photos are allowed.`);
  }

  const plan = planPhotoSync(fullEntries, stored, uploaded);

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
 * Maps submitted photo entries onto the parent's stored links and fresh uploads, producing the
 * link rows to re-insert with new positions and the stored photos that were dropped. Unknown ids
 * are rejected so a request can never attach photos owned by another parent.
 */
function planPhotoSync(
  entries: PhotoEntry[],
  stored: StoredPhotoLink[],
  uploaded: UploadedImage[],
) {
  const storedById = new Map(stored.map((link) => [link.id, link]));
  const remainingUploads = uploaded.values();

  const links = entries.map((entry, position) => {
    if (entry instanceof File) {
      const image = remainingUploads.next().value;

      if (!image) {
        throw new Error('Uploaded image count does not match photo entries');
      }

      return { position, uploadObjectId: image.id };
    }

    const link = storedById.get(entry);

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
