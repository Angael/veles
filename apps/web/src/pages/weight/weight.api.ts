import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { and, asc, count, eq, sql } from 'drizzle-orm';
import { dateOnlyType } from '@/lib/dateOnly';
import { uploadObjects, weightEntries, weightEntryPhotos } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { storagePathToUrl } from '@/server/storage/config.server';
import {
  DEFAULT_WEIGHT_CHART_RANGE,
  WEIGHT_CHART_RANGE_COOKIE,
  WEIGHT_CHART_RANGES,
} from './weightCalculations';

export type WeightEntry = {
  date: string;
  weightKg: number;
};

export type WeightHistoryEntry = WeightEntry & {
  photoCount: number;
};

export type WeightEntryPhoto = {
  id: string;
  url: string | null;
};

export const MAX_WEIGHT_IMPORT_ENTRIES = 3_000;

const saveWeightInputType = type({
  date: dateOnlyType,
  weightKg: '30 <= number <= 300',
});

const weightEntryDateInputType = type({ date: dateOnlyType });

const saveWeightsInputType = type({
  entries: saveWeightInputType.array().atLeastLength(1).atMostLength(MAX_WEIGHT_IMPORT_ENTRIES),
});

export const getWeightEntries = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWeightEntries')])
  .handler(async (): Promise<WeightHistoryEntry[]> => {
    const session = await requireSession();
    const entries = await db
      .select({
        date: weightEntries.date,
        photoCount: count(weightEntryPhotos.id),
        weightGrams: weightEntries.weightGrams,
      })
      .from(weightEntries)
      .leftJoin(weightEntryPhotos, eq(weightEntryPhotos.weightEntryId, weightEntries.id))
      .where(eq(weightEntries.userId, session.user.id))
      .groupBy(weightEntries.id)
      .orderBy(asc(weightEntries.date));

    return entries
      .filter((entry) => dateOnlyType.allows(entry.date))
      .map((entry) => ({
        date: entry.date,
        photoCount: entry.photoCount,
        weightKg: entry.weightGrams / 1_000,
      }));
  });

export const getWeightEntry = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWeightEntry')])
  .validator(arkTypeValidator(weightEntryDateInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [entry] = await db
      .select({ id: weightEntries.id, weightGrams: weightEntries.weightGrams })
      .from(weightEntries)
      .where(and(eq(weightEntries.userId, session.user.id), eq(weightEntries.date, data.date)))
      .limit(1);

    if (!entry) {
      throw new ClientSafeError('Weight entry not found.');
    }

    const photos = await db
      .select({ id: weightEntryPhotos.id, key: uploadObjects.key })
      .from(weightEntryPhotos)
      .innerJoin(uploadObjects, eq(uploadObjects.id, weightEntryPhotos.uploadObjectId))
      .where(eq(weightEntryPhotos.weightEntryId, entry.id))
      .orderBy(asc(weightEntryPhotos.position));

    return {
      date: data.date,
      photos: photos.map((photo): WeightEntryPhoto => ({
        id: photo.id,
        url: storagePathToUrl(photo.key),
      })),
      weightKg: entry.weightGrams / 1_000,
    };
  });

export const getWeightChartRange = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWeightChartRange')])
  .handler(() => {
    const cookieRange = getCookie(WEIGHT_CHART_RANGE_COOKIE);

    return WEIGHT_CHART_RANGES.find((range) => range === cookieRange) ?? DEFAULT_WEIGHT_CHART_RANGE;
  });

export const saveWeight = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('saveWeight')])
  .validator(arkTypeValidator(saveWeightInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const weightGrams = Math.round(data.weightKg * 1_000);

    await db
      .insert(weightEntries)
      .values({
        date: data.date,
        userId: session.user.id,
        weightGrams,
      })
      .onConflictDoUpdate({
        set: { weightGrams },
        target: [weightEntries.userId, weightEntries.date],
      });
  });

export const saveWeights = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('saveWeights')])
  .validator(arkTypeValidator(saveWeightsInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    await db
      .insert(weightEntries)
      .values(
        data.entries.map((entry) => ({
          date: entry.date,
          userId: session.user.id,
          weightGrams: Math.round(entry.weightKg * 1_000),
        })),
      )
      .onConflictDoUpdate({
        set: { weightGrams: sql`excluded.${sql.identifier(weightEntries.weightGrams.name)}` },
        target: [weightEntries.userId, weightEntries.date],
      });
  });
