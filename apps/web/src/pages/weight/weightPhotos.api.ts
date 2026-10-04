import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { uploadObjects, weightEntries, weightEntryPhotos } from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { readOrderedPhotos } from '@/lib/storage/orderedPhotos';
import { IMAGE_MAX_INPUT_BYTES } from '@/lib/storage/imageLimits';
import type { DbTransaction } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { limitRequestSizeMiddleware } from '@/server/middleware/limitRequestSizeMiddleware';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { type PhotoLinkTable, persistWithPhotos } from '@/server/storage/photoSync.server';

// Keep below nginx's client_max_body_size with enough headroom for multipart form overhead.
const WEIGHT_PHOTO_MAX_REQUEST_BYTES = 85 * 1024 * 1024;
// Objects live in the public bucket; keys stay random v4 UUIDs (see weightEntryPhotos schema).
const WEIGHT_PHOTO_KEY_PREFIX = 'weight-photos';

export const WEIGHT_PHOTO_MAX_COUNT = 6;
export const WEIGHT_PHOTO_MAX_BYTES = IMAGE_MAX_INPUT_BYTES;

const formDataType = type('FormData');
const weightEntryFieldsType = type({
  date: dateOnlyType,
  weightKg: 'string.numeric.parse |> 30 <= number <= 300',
});

/** Add form: saves the day's weight and appends photos after any the entry already has. */
export const addWeightEntry = createServerFn({ method: 'POST' })
  .middleware([
    logMiddleware('addWeightEntry'),
    limitRequestSizeMiddleware(WEIGHT_PHOTO_MAX_REQUEST_BYTES),
  ])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await persistWeightEntry(data, session.user.id, 'append');
  });

/** Edit form: saves the weight and replaces the photo list with the submitted order. */
export const updateWeightEntry = createServerFn({ method: 'POST' })
  .middleware([
    logMiddleware('updateWeightEntry'),
    limitRequestSizeMiddleware(WEIGHT_PHOTO_MAX_REQUEST_BYTES),
  ])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await persistWeightEntry(data, session.user.id, 'replace');
  });

/** Upserts the weight for one date and syncs its photos in the same transaction. */
async function persistWeightEntry(formData: FormData, userId: string, mode: 'append' | 'replace') {
  const fields = weightEntryFieldsType({
    date: formData.get('date'),
    weightKg: formData.get('weightKg'),
  });

  if (fields instanceof type.errors) {
    throw new ClientSafeError(fields.summary);
  }

  const order = readOrderedPhotos(formData, {
    maxBytes: WEIGHT_PHOTO_MAX_BYTES,
    maxCount: WEIGHT_PHOTO_MAX_COUNT,
  });
  const weightGrams = Math.round(fields.weightKg * 1_000);

  await persistWithPhotos(
    { keyPrefix: WEIGHT_PHOTO_KEY_PREFIX, order, userId },
    async (tx, photos) => {
      // The upsert locks the entry row, so concurrent saves for one date run one after another.
      const [entry] = await tx
        .insert(weightEntries)
        .values({ date: fields.date, userId, weightGrams })
        .onConflictDoUpdate({
          set: { weightGrams },
          target: [weightEntries.userId, weightEntries.date],
        })
        .returning({ id: weightEntries.id });

      if (!entry) {
        throw new Error('Weight entry upsert returned no row');
      }

      await photos.sync(weightEntryPhotoLinks(tx, entry.id), {
        maxCount: WEIGHT_PHOTO_MAX_COUNT,
        mode,
      });
    },
  );
}

function weightEntryPhotoLinks(tx: DbTransaction, weightEntryId: string): PhotoLinkTable {
  return {
    deleteAll: () =>
      tx.delete(weightEntryPhotos).where(eq(weightEntryPhotos.weightEntryId, weightEntryId)),
    insert: (links) =>
      tx.insert(weightEntryPhotos).values(links.map((link) => ({ ...link, weightEntryId }))),
    selectStored: () =>
      tx
        .select({
          createdAt: weightEntryPhotos.createdAt,
          id: weightEntryPhotos.id,
          key: uploadObjects.key,
          uploadObjectId: weightEntryPhotos.uploadObjectId,
        })
        .from(weightEntryPhotos)
        .innerJoin(uploadObjects, eq(uploadObjects.id, weightEntryPhotos.uploadObjectId))
        .where(eq(weightEntryPhotos.weightEntryId, weightEntryId)),
  };
}
