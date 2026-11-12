import { GetObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { createDatabaseConnection } from '@veles/db';
import { foodLogs, foodPhotoScans, foodProducts, uploadObjects } from '@veles/db/schema';
import { and, asc, eq, inArray, lt, sql } from 'drizzle-orm';
import {
  type AiConfig,
  analyzeFoodPhotos,
  type FoodPhotoImage,
  FoodPhotoRejectedError,
  type FoodPhotoResult,
} from './food-photo-ai.ts';
import { errorMessage } from './job.ts';

type Database = ReturnType<typeof createDatabaseConnection>['db'];
type Scan = typeof foodPhotoScans.$inferSelect;
type ScanPhoto = FoodPhotoImage & { id: string };

const maxAttempts = 3;
/** A scan stuck in `processing` this long belongs to a worker that died; it is retried. */
const staleProcessingMs = 5 * 60 * 1000;

const hundredths = (value: number) => Math.round(value * 100);
const optionalHundredths = (value: number | null) => (value === null ? null : hundredths(value));

/** Processes queued photo scans one by one until the queue is empty or the worker stops. */
export function createFoodPhotoScanner(db: Database, s3: S3Client, ai: AiConfig) {
  /** Locks the oldest pending scan, so two workers never analyze the same photos. */
  async function claimNextScan() {
    return db.transaction(async (tx) => {
      await tx
        .update(foodPhotoScans)
        .set({ status: 'pending', updatedAt: new Date() })
        .where(
          and(
            eq(foodPhotoScans.status, 'processing'),
            lt(foodPhotoScans.updatedAt, new Date(Date.now() - staleProcessingMs)),
          ),
        );
      const [scan] = await tx
        .select()
        .from(foodPhotoScans)
        .where(eq(foodPhotoScans.status, 'pending'))
        .orderBy(asc(foodPhotoScans.createdAt))
        .limit(1)
        .for('update', { skipLocked: true });
      if (!scan) return null;

      const [claimed] = await tx
        .update(foodPhotoScans)
        .set({
          status: 'processing',
          attempts: sql`${foodPhotoScans.attempts} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(foodPhotoScans.id, scan.id))
        .returning();
      return claimed ?? null;
    });
  }

  /** Downloads the scan's photos in shooting order, keeping each id for the cover photo. */
  async function loadImages(scan: Scan, signal: AbortSignal): Promise<ScanPhoto[]> {
    const assets = await db
      .select()
      .from(uploadObjects)
      .where(inArray(uploadObjects.id, scan.photoUploadObjectIds));
    const photos: ScanPhoto[] = [];

    for (const id of scan.photoUploadObjectIds) {
      const asset = assets.find((candidate) => candidate.id === id);
      if (!asset) continue;
      const object = await s3.send(new GetObjectCommand({ Bucket: asset.bucket, Key: asset.key }), {
        abortSignal: signal,
      });
      const bytes = await object.Body?.transformToByteArray();
      if (!bytes) throw new Error(`Photo ${asset.id} is empty`);
      const base64 = Buffer.from(bytes).toString('base64');
      photos.push({ dataUrl: `data:${asset.mimeType ?? 'image/webp'};base64,${base64}`, id });
    }

    if (photos.length === 0) throw new FoodPhotoRejectedError('Photos are missing');
    return photos;
  }

  /** Creates the shared product and, with an amount, the user's log in one transaction. */
  async function saveResult(scan: Scan, result: FoodPhotoResult, coverPhotoId: string) {
    await db.transaction(async (tx) => {
      const [barcodeOwner] = scan.barcode
        ? await tx
            .select({ id: foodProducts.id })
            .from(foodProducts)
            .where(eq(foodProducts.barcode, scan.barcode))
            .limit(1)
        : [];

      const [product] = await tx
        .insert(foodProducts)
        .values({
          name: result.name,
          barcode: barcodeOwner ? null : scan.barcode,
          imageUploadObjectId: coverPhotoId,
          productSizeGramsHundredths: optionalHundredths(result.productSizeGrams),
          unit: result.unit,
          kcalPer100gHundredths: hundredths(result.kcalPer100g),
          proteinPer100gHundredths: optionalHundredths(result.proteinPer100g),
          fatPer100gHundredths: optionalHundredths(result.fatPer100g),
          carbsPer100gHundredths: optionalHundredths(result.carbsPer100g),
        })
        .returning({ id: foodProducts.id });
      if (!product) throw new Error('Food product could not be created');

      let foodLogId: string | null = null;
      if (scan.gramsHundredths !== null) {
        const grams = scan.gramsHundredths / 100;
        const scaled = (per100g: number | null) =>
          per100g === null ? null : hundredths((per100g * grams) / 100);
        const [log] = await tx
          .insert(foodLogs)
          .values({
            userId: scan.userId,
            productId: product.id,
            imageUploadObjectId: coverPhotoId,
            name: result.name,
            gramsHundredths: scan.gramsHundredths,
            logDate: scan.logDate,
            kcalHundredths: scaled(result.kcalPer100g) ?? 0,
            proteinHundredths: scaled(result.proteinPer100g),
            fatHundredths: scaled(result.fatPer100g),
            carbsHundredths: scaled(result.carbsPer100g),
          })
          .returning({ id: foodLogs.id });
        if (!log) throw new Error('Food log could not be created');
        foodLogId = log.id;
      }

      // Releasing the other photos lets upload cleanup delete them.
      await tx
        .update(foodPhotoScans)
        .set({
          status: 'done',
          error: null,
          foodLogId,
          photoUploadObjectIds: [coverPhotoId],
          updatedAt: new Date(),
        })
        .where(eq(foodPhotoScans.id, scan.id));
    });
  }

  async function processScan(scan: Scan, signal: AbortSignal) {
    try {
      const photos = await loadImages(scan, signal);
      const result = await analyzeFoodPhotos(ai, photos, signal);
      const cover = photos[result.coverPhotoIndex] ?? photos[0];
      if (!cover) throw new FoodPhotoRejectedError('Photos are missing');
      await saveResult(scan, result, cover.id);
      console.info('food photo scan done', { id: scan.id });
    } catch (error) {
      if (signal.aborted) {
        // Shutdown: give the attempt back so the next start retries it.
        await db
          .update(foodPhotoScans)
          .set({ status: 'pending', attempts: Math.max(0, scan.attempts - 1) })
          .where(eq(foodPhotoScans.id, scan.id));
        return;
      }
      const final = error instanceof FoodPhotoRejectedError || scan.attempts >= maxAttempts;
      console.error('food photo scan failed', { id: scan.id, error: errorMessage(error), final });
      await db
        .update(foodPhotoScans)
        .set({
          status: final ? 'failed' : 'pending',
          error: errorMessage(error).slice(0, 500),
          updatedAt: new Date(),
        })
        .where(eq(foodPhotoScans.id, scan.id));
    }
  }

  return async function run(signal: AbortSignal) {
    while (!signal.aborted) {
      const scan = await claimNextScan();
      if (!scan) return;
      await processScan(scan, signal);
    }
  };
}
