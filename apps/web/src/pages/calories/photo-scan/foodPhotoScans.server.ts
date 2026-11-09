import { and, count, eq, gt, inArray, ne, or } from 'drizzle-orm';
import { foodPhotoScans, uploadObjects } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { translate } from '@/lib/i18n/getLocale';
import { toHundredths } from '@/lib/nutrition';
import { db } from '@/server/db.server';
import { storagePathToUrl } from '@/server/storage/config.server';
import {
  getFoodImageAssets,
  type PreparedFoodImage,
  prepareFoodImage,
  rollbackImage,
} from '../foodImages.server';
import { recordFoodRecord } from '../foodLogs.server';
import { lookupFoodByBarcodeRecord } from '../foodProducts.server';
import type { foodPhotoScanValuesType } from './foodPhotoScans.validation';

/** Each scan is one paid AI call; the cap keeps a bug or a busy user from draining the budget. */
export const FOOD_PHOTO_SCANS_PER_DAY = 30;
/** Keeps finished scans visible long enough for the log to swap the pending row for the entry. */
const DONE_SCAN_VISIBLE_MS = 15_000;
/** Label text must stay readable for the AI, so scans keep more detail than catalog uploads. */
const SCAN_PHOTO_MAX_SIDE = 1600;

export type FoodPhotoScan = {
  id: string;
  foodLogId: string | null;
  /** Null when the scan only adds the product to the catalog. */
  grams: number | null;
  imageUrl: string | null;
  status: 'pending' | 'processing' | 'failed' | 'done';
};

/**
 * Uses a known barcode at once; otherwise stores the photos and queues them for the worker's AI.
 * The status tells the page whether the product was logged, already exists, or was queued.
 */
export async function enqueueFoodPhotoScanRecord(
  userId: string,
  values: typeof foodPhotoScanValuesType.infer,
  photos: File[],
) {
  if (values.barcode) {
    const lookup = await lookupFoodByBarcodeRecord(userId, { barcode: values.barcode });
    if (lookup.status === 'found') {
      if (values.grams === undefined) {
        return { name: lookup.food.name, status: 'exists' as const };
      }
      await recordFoodRecord(userId, {
        date: values.date,
        grams: values.grams,
        productId: lookup.food.id,
      });
      return { name: lookup.food.name, status: 'logged' as const };
    }
  }

  const [recent] = await db
    .select({ total: count() })
    .from(foodPhotoScans)
    .where(
      and(
        eq(foodPhotoScans.userId, userId),
        gt(foodPhotoScans.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
      ),
    );
  if ((recent?.total ?? 0) >= FOOD_PHOTO_SCANS_PER_DAY) {
    throw new ClientSafeError(
      translate({
        en: `You can send up to ${FOOD_PHOTO_SCANS_PER_DAY} photo products a day.`,
        pl: `Możesz wysłać do ${FOOD_PHOTO_SCANS_PER_DAY} produktów ze zdjęć dziennie.`,
      }),
    );
  }

  const images: PreparedFoodImage[] = [];
  try {
    for (const photo of photos) {
      images.push(await prepareFoodImage(photo, userId, SCAN_PHOTO_MAX_SIDE));
    }

    await db.transaction(async (tx) => {
      await tx.insert(uploadObjects).values(images.map((image) => image.asset));
      await tx.insert(foodPhotoScans).values({
        userId,
        logDate: values.date,
        gramsHundredths: values.grams === undefined ? null : toHundredths(values.grams),
        barcode: values.barcode ?? null,
        photoUploadObjectIds: images.map((image) => image.asset.id),
      });
    });
  } catch (error) {
    await Promise.all(images.map(rollbackImage));
    throw error;
  }
  return { status: 'queued' as const };
}

/** Scans of the day still analyzing or failed, plus just-finished ones for the swap animation. */
export async function getFoodPhotoScansRecord(userId: string, date: string) {
  const rows = await db
    .select()
    .from(foodPhotoScans)
    .where(
      and(
        eq(foodPhotoScans.userId, userId),
        eq(foodPhotoScans.logDate, date),
        or(
          ne(foodPhotoScans.status, 'done'),
          gt(foodPhotoScans.updatedAt, new Date(Date.now() - DONE_SCAN_VISIBLE_MS)),
        ),
      ),
    )
    .orderBy(foodPhotoScans.createdAt);
  const assets = await getFoodImageAssets(rows.map((row) => row.photoUploadObjectIds[0]));

  return rows.map((row): FoodPhotoScan => {
    const coverId = row.photoUploadObjectIds[0];
    const asset = coverId ? assets.get(coverId) : undefined;
    return {
      id: row.id,
      foodLogId: row.foodLogId,
      grams: row.gramsHundredths === null ? null : row.gramsHundredths / 100,
      imageUrl: asset ? storagePathToUrl(asset.key) : null,
      status: scanStatus(row.status),
    };
  });
}

function scanStatus(status: string): FoodPhotoScan['status'] {
  if (status === 'failed' || status === 'processing' || status === 'done') return status;
  return 'pending';
}

export async function retryFoodPhotoScanRecord(userId: string, id: string) {
  await db
    .update(foodPhotoScans)
    .set({ status: 'pending', attempts: 0, error: null, updatedAt: new Date() })
    .where(
      and(
        eq(foodPhotoScans.id, id),
        eq(foodPhotoScans.userId, userId),
        eq(foodPhotoScans.status, 'failed'),
      ),
    );
}

/** Upload cleanup deletes the photos once no scan or product references them. */
export async function deleteFoodPhotoScanRecord(userId: string, id: string) {
  await db
    .delete(foodPhotoScans)
    .where(
      and(
        eq(foodPhotoScans.id, id),
        eq(foodPhotoScans.userId, userId),
        inArray(foodPhotoScans.status, ['pending', 'failed']),
      ),
    );
}
