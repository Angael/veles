import { and, count, eq, gt, inArray, ne } from 'drizzle-orm';
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

export type FoodPhotoScan = {
  id: string;
  grams: number;
  imageUrl: string | null;
  status: 'pending' | 'processing' | 'failed';
};

/**
 * Logs a known barcode at once; otherwise stores the photos and queues them for the worker's AI.
 * Returns `logged` or `queued` so the page can tell the user which happened.
 */
export async function enqueueFoodPhotoScanRecord(
  userId: string,
  values: typeof foodPhotoScanValuesType.infer,
  front: File,
  label: File | null,
) {
  if (values.barcode) {
    const lookup = await lookupFoodByBarcodeRecord(userId, { barcode: values.barcode });
    if (lookup.status === 'found') {
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
    const frontImage = await prepareFoodImage(front, userId);
    images.push(frontImage);
    const labelImage = label ? await prepareFoodImage(label, userId) : null;
    if (labelImage) images.push(labelImage);

    await db.transaction(async (tx) => {
      await tx.insert(uploadObjects).values(images.map((image) => image.asset));
      await tx.insert(foodPhotoScans).values({
        userId,
        logDate: values.date,
        gramsHundredths: toHundredths(values.grams),
        barcode: values.barcode ?? null,
        frontUploadObjectId: frontImage.asset.id,
        labelUploadObjectId: labelImage?.asset.id ?? null,
      });
    });
  } catch (error) {
    await Promise.all(images.map(rollbackImage));
    throw error;
  }
  return { status: 'queued' as const };
}

/** Scans of the day that are not in the log yet: still analyzing, or failed. */
export async function getFoodPhotoScansRecord(userId: string, date: string) {
  const rows = await db
    .select()
    .from(foodPhotoScans)
    .where(
      and(
        eq(foodPhotoScans.userId, userId),
        eq(foodPhotoScans.logDate, date),
        ne(foodPhotoScans.status, 'done'),
      ),
    )
    .orderBy(foodPhotoScans.createdAt);
  const assets = await getFoodImageAssets(rows.map((row) => row.frontUploadObjectId));

  return rows.map((row): FoodPhotoScan => {
    const asset = assets.get(row.frontUploadObjectId);
    return {
      id: row.id,
      grams: row.gramsHundredths / 100,
      imageUrl: asset ? storagePathToUrl(asset.key) : null,
      status: scanStatus(row.status),
    };
  });
}

function scanStatus(status: string): FoodPhotoScan['status'] {
  if (status === 'failed' || status === 'processing') return status;
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
