import { randomUUID } from 'node:crypto';
import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, count, eq, max } from 'drizzle-orm';
import { uploadObjects, weightEntries, weightEntryPhotos } from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { IMAGE_MAX_INPUT_BYTES } from '@/lib/storage/imageLimits';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { log } from '@/server/logger.server';
import { limitRequestSizeMiddleware } from '@/server/middleware/limitRequestSizeMiddleware';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { getStorageConfig } from '@/server/storage/config.server';
import { optimizeImage } from '@/server/storage/image.server';
import { deleteFileByKey, uploadFileByKey } from '@/server/storage/r2.server';

// Keep below nginx's client_max_body_size with enough headroom for multipart form overhead.
const WEIGHT_PHOTO_MAX_REQUEST_BYTES = 85 * 1024 * 1024;

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
const deleteWeightPhotoInputType = type({ id: 'string.uuid' });

type UploadedWeightPhoto = { id: string; key: string; mimeType: string };

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

    const uploaded: UploadedWeightPhoto[] = [];

    try {
      for (const file of input.photos) {
        const optimizedImage = await optimizeImage(file);
        // Random v4 keys keep owner-private photos unguessable inside the public bucket.
        const photo = {
          id: randomUUID(),
          key: `weight-photos/${randomUUID()}.webp`,
          mimeType: optimizedImage.type,
        };

        await uploadFileByKey({
          body: optimizedImage.buffer,
          bucket: 'public',
          contentType: optimizedImage.type,
          key: photo.key,
        });
        uploaded.push(photo);
      }

      await insertWeightPhotos(entry.id, session.user.id, uploaded);
    } catch (error) {
      await Promise.allSettled(uploaded.map((photo) => deleteFileByKey(photo.key, 'public')));
      throw error;
    }
  });

export const deleteWeightPhoto = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteWeightPhoto')])
  .validator(arkTypeValidator(deleteWeightPhotoInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [photo] = await db
      .select({ key: uploadObjects.key, uploadObjectId: uploadObjects.id })
      .from(weightEntryPhotos)
      .innerJoin(weightEntries, eq(weightEntries.id, weightEntryPhotos.weightEntryId))
      .innerJoin(uploadObjects, eq(uploadObjects.id, weightEntryPhotos.uploadObjectId))
      .where(and(eq(weightEntryPhotos.id, data.id), eq(weightEntries.userId, session.user.id)))
      .limit(1);

    if (!photo) {
      throw new ClientSafeError('Photo not found.');
    }

    // Deleting the upload row cascades to the photo link; the weight entry stays untouched.
    await db.delete(uploadObjects).where(eq(uploadObjects.id, photo.uploadObjectId));

    try {
      await deleteFileByKey(photo.key, 'public');
    } catch (error) {
      log.error('Weight photo file delete failed', {
        error: error instanceof Error ? error.message : String(error),
        key: photo.key,
      });
    }
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
async function insertWeightPhotos(
  weightEntryId: string,
  userId: string,
  photos: UploadedWeightPhoto[],
) {
  const { bucketName } = getStorageConfig();

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

    await tx.insert(uploadObjects).values(
      photos.map((photo) => ({
        bucket: bucketName,
        id: photo.id,
        key: photo.key,
        mimeType: photo.mimeType,
        userId,
      })),
    );
    await tx.insert(weightEntryPhotos).values(
      photos.map((photo, index) => ({
        position: firstPosition + index,
        uploadObjectId: photo.id,
        weightEntryId,
      })),
    );
  });
}
