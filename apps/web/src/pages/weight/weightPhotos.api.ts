import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, count, eq, inArray, max } from 'drizzle-orm';
import { uploadObjects, weightEntries, weightEntryPhotos } from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { readOrderedPhotos } from '@/lib/storage/orderedPhotos';
import { IMAGE_MAX_INPUT_BYTES } from '@/lib/storage/imageLimits';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { limitRequestSizeMiddleware } from '@/server/middleware/limitRequestSizeMiddleware';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import {
  deleteImageFiles,
  planPhotoSync,
  toUploadObjectRows,
  type UploadedImage,
  uploadOptimizedImages,
} from '@/server/storage/photoSync.server';

// Keep below nginx's client_max_body_size with enough headroom for multipart form overhead.
const WEIGHT_PHOTO_MAX_REQUEST_BYTES = 85 * 1024 * 1024;
// Objects live in the public bucket; keys stay random v4 UUIDs (see weightEntryPhotos schema).
const WEIGHT_PHOTO_KEY_PREFIX = 'weight-photos';

export const WEIGHT_PHOTO_MAX_COUNT = 6;
export const WEIGHT_PHOTO_MAX_BYTES = IMAGE_MAX_INPUT_BYTES;

const formDataType = type('FormData');
const addWeightPhotosInputType = type({
  date: dateOnlyType,
  photos: type('File[]')
    .atLeastLength(1)
    .atMostLength(WEIGHT_PHOTO_MAX_COUNT)
    .narrow((files, context) =>
      files.every((file) => file.size <= WEIGHT_PHOTO_MAX_BYTES)
        ? true
        : context.mustBe('photos no larger than 10 MiB each'),
    ),
});
const updateWeightEntryInputType = type({
  date: dateOnlyType,
  weightKg: 'string.numeric.parse |> 30 <= number <= 300',
});

export const addWeightPhotos = createServerFn({ method: 'POST' })
  .middleware([
    logMiddleware('addWeightPhotos'),
    limitRequestSizeMiddleware(WEIGHT_PHOTO_MAX_REQUEST_BYTES),
  ])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const input = validateAddWeightPhotosForm(data);
    const entry = await findOwnedEntry(session.user.id, input.date);
    await assertPhotoCapacity(entry.id, input.photos.length);

    const uploaded = await uploadOptimizedImages(input.photos, WEIGHT_PHOTO_KEY_PREFIX);

    try {
      await insertWeightPhotos(entry.id, session.user.id, uploaded);
    } catch (error) {
      await deleteImageFiles(uploaded.map((photo) => photo.key));
      throw error;
    }
  });

/**
 * Saves the weight and replaces the entry's photo list with the submitted order in one
 * transaction. New files are uploaded first; dropped photos are deleted from storage after commit.
 */
export const updateWeightEntry = createServerFn({ method: 'POST' })
  .middleware([
    logMiddleware('updateWeightEntry'),
    limitRequestSizeMiddleware(WEIGHT_PHOTO_MAX_REQUEST_BYTES),
  ])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const input = updateWeightEntryInputType({
      date: data.get('date'),
      weightKg: data.get('weightKg'),
    });

    if (input instanceof type.errors) {
      throw new ClientSafeError(input.summary);
    }

    const order = readOrderedPhotos(data, {
      maxBytes: WEIGHT_PHOTO_MAX_BYTES,
      maxCount: WEIGHT_PHOTO_MAX_COUNT,
    });
    const entry = await findOwnedEntry(session.user.id, input.date);
    const uploaded = await uploadOptimizedImages(
      order.flatMap((slot) => (slot.kind === 'file' ? [slot.file] : [])),
      WEIGHT_PHOTO_KEY_PREFIX,
    );
    let removedKeys: string[];

    try {
      removedKeys = await db.transaction(async (tx) => {
        // Updating the entry row locks it, serializing with concurrent photo uploads.
        await tx
          .update(weightEntries)
          .set({ weightGrams: Math.round(input.weightKg * 1_000) })
          .where(eq(weightEntries.id, entry.id));

        const stored = await tx
          .select({
            createdAt: weightEntryPhotos.createdAt,
            id: weightEntryPhotos.id,
            key: uploadObjects.key,
            uploadObjectId: weightEntryPhotos.uploadObjectId,
          })
          .from(weightEntryPhotos)
          .innerJoin(uploadObjects, eq(uploadObjects.id, weightEntryPhotos.uploadObjectId))
          .where(eq(weightEntryPhotos.weightEntryId, entry.id));
        const plan = planPhotoSync(order, stored, uploaded);

        // Re-inserting links sidesteps the unique (entry, position) index while reordering.
        await tx.delete(weightEntryPhotos).where(eq(weightEntryPhotos.weightEntryId, entry.id));

        if (plan.removed.length > 0) {
          await tx.delete(uploadObjects).where(
            inArray(
              uploadObjects.id,
              plan.removed.map((link) => link.uploadObjectId),
            ),
          );
        }

        if (uploaded.length > 0) {
          await tx.insert(uploadObjects).values(toUploadObjectRows(uploaded, session.user.id));
        }

        if (plan.links.length > 0) {
          await tx
            .insert(weightEntryPhotos)
            .values(plan.links.map((link) => ({ ...link, weightEntryId: entry.id })));
        }

        return plan.removed.map((link) => link.key);
      });
    } catch (error) {
      await deleteImageFiles(uploaded.map((photo) => photo.key));
      throw error;
    }

    await deleteImageFiles(removedKeys);
  });

/** Pulls the date and non-empty files out of multipart data and enforces per-request limits. */
function validateAddWeightPhotosForm(formData: FormData) {
  const photos = formData
    .getAll('photos')
    .filter((value): value is File => value instanceof File && value.size > 0);
  const validation = addWeightPhotosInputType({ date: formData.get('date'), photos });

  if (validation instanceof type.errors) {
    throw new ClientSafeError(validation.summary);
  }

  return validation;
}

async function findOwnedEntry(userId: string, date: string) {
  const [entry] = await db
    .select({ id: weightEntries.id })
    .from(weightEntries)
    .where(and(eq(weightEntries.userId, userId), eq(weightEntries.date, date)))
    .limit(1);

  if (!entry) {
    throw new ClientSafeError('Save the weight for this date before adding photos.');
  }

  return entry;
}

/** Fails before uploading anything when the entry cannot fit the new photos. */
async function assertPhotoCapacity(weightEntryId: string, newPhotoCount: number) {
  const [existing] = await db
    .select({ count: count() })
    .from(weightEntryPhotos)
    .where(eq(weightEntryPhotos.weightEntryId, weightEntryId));

  if ((existing?.count ?? 0) + newPhotoCount > WEIGHT_PHOTO_MAX_COUNT) {
    throw new ClientSafeError(`A weight entry can have up to ${WEIGHT_PHOTO_MAX_COUNT} photos.`);
  }
}

/**
 * Records uploaded files after the existing photos. Locks the entry row so concurrent uploads
 * cannot exceed the limit or collide on positions.
 */
async function insertWeightPhotos(weightEntryId: string, userId: string, photos: UploadedImage[]) {
  await db.transaction(async (tx) => {
    await tx
      .select({ id: weightEntries.id })
      .from(weightEntries)
      .where(eq(weightEntries.id, weightEntryId))
      .for('update');

    const [existing] = await tx
      .select({ count: count(), lastPosition: max(weightEntryPhotos.position) })
      .from(weightEntryPhotos)
      .where(eq(weightEntryPhotos.weightEntryId, weightEntryId));

    if ((existing?.count ?? 0) + photos.length > WEIGHT_PHOTO_MAX_COUNT) {
      throw new ClientSafeError(`A weight entry can have up to ${WEIGHT_PHOTO_MAX_COUNT} photos.`);
    }

    const firstPosition = (existing?.lastPosition ?? -1) + 1;

    await tx.insert(uploadObjects).values(toUploadObjectRows(photos, userId));
    await tx.insert(weightEntryPhotos).values(
      photos.map((photo, index) => ({
        position: firstPosition + index,
        uploadObjectId: photo.id,
        weightEntryId,
      })),
    );
  });
}
