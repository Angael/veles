import { and, eq, inArray, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { foodLogs, foodProducts, uploadObjects } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { fromHundredths, HUNDREDTHS, optionalHundredths, toHundredths } from '@/lib/nutrition';
import { db } from '@/server/db.server';
import { storagePathToUrl } from '@/server/storage/config.server';
import type { CalorieLog } from './calories.api';
import type {
  foodLogIdsInputType,
  foodLogsDateInputType,
  multiplyFoodLogsInputType,
  recordCustomCaloriesValuesType,
  recordFoodValuesType,
  updateFoodLogValuesType,
} from './calories.validation';
import { getFoodImageAssets, prepareImageAction, rollbackImage } from './foodImages.server';

export function toCalorieLog(
  logEntry: typeof foodLogs.$inferSelect,
  logAsset: typeof uploadObjects.$inferSelect | undefined,
  productAsset?: typeof uploadObjects.$inferSelect,
): CalorieLog {
  const asset = logAsset ?? productAsset;

  return {
    id: logEntry.id,
    name: logEntry.name,
    productId: logEntry.productId,
    date: logEntry.logDate,
    consumedAt: logEntry.consumedAt.toISOString(),
    grams: fromHundredths(logEntry.gramsHundredths),
    kcal: logEntry.kcalHundredths / HUNDREDTHS,
    protein: fromHundredths(logEntry.proteinHundredths),
    fat: fromHundredths(logEntry.fatHundredths),
    carbs: fromHundredths(logEntry.carbsHundredths),
    imageUrl: asset ? storagePathToUrl(asset.key) : null,
  };
}

async function withImage(entry: typeof foodLogs.$inferSelect) {
  const assetsById = await getFoodImageAssets([entry.imageUploadObjectId]);
  return toCalorieLog(entry, assetsById.get(entry.imageUploadObjectId ?? ''));
}

/** Logs grams of a catalog product, snapshotting its nutrition scaled to the eaten amount. */
export async function recordFoodRecord(userId: string, values: typeof recordFoodValuesType.infer) {
  const [product] = await db
    .select()
    .from(foodProducts)
    .where(eq(foodProducts.id, values.productId))
    .limit(1);
  if (!product) throw new ClientSafeError('The selected food product no longer exists.');

  const productAssets = await getFoodImageAssets([product.imageUploadObjectId]);
  const productAsset = productAssets.get(product.imageUploadObjectId ?? '');
  const imageUploadObjectId = productAsset?.id ?? null;

  const gramsHundredths = toHundredths(values.grams);
  const scale = (value: number | null) =>
    value === null ? null : Math.round((value * gramsHundredths) / (100 * HUNDREDTHS));

  const [inserted] = await db
    .insert(foodLogs)
    .values({
      name: product.name,
      productId: product.id,
      imageUploadObjectId,
      gramsHundredths,
      kcalHundredths: scale(product.kcalPer100gHundredths) ?? 0,
      proteinHundredths: scale(product.proteinPer100gHundredths),
      fatHundredths: scale(product.fatPer100gHundredths),
      carbsHundredths: scale(product.carbsPer100gHundredths),
      logDate: values.date,
      consumedAt: new Date(),
      userId,
    })
    .returning();

  if (!inserted) throw new Error('Food log could not be created.');
  return withImage(inserted);
}

/** Logs a food that is not in the catalog, with the nutrition the user entered. */
export async function recordCustomCaloriesRecord(
  userId: string,
  values: typeof recordCustomCaloriesValuesType.infer,
  photo: File | null = null,
) {
  const action = values.imageAction ?? 'keep';
  const image = await prepareImageAction(action, photo, userId);

  try {
    const [inserted] = await db.transaction(async (tx) => {
      if (image) await tx.insert(uploadObjects).values(image.asset);
      return tx
        .insert(foodLogs)
        .values({
          name: values.name.trim(),
          productId: null,
          imageUploadObjectId: action === 'replace' ? (image?.asset.id ?? null) : null,
          gramsHundredths: optionalHundredths(values.grams ?? undefined),
          kcalHundredths: toHundredths(values.kcal),
          proteinHundredths: optionalHundredths(values.protein ?? undefined),
          fatHundredths: optionalHundredths(values.fat ?? undefined),
          carbsHundredths: optionalHundredths(values.carbs ?? undefined),
          logDate: values.date,
          consumedAt: new Date(),
          userId,
        })
        .returning();
    });

    if (!inserted) throw new Error('Food log could not be created.');
    return await withImage(inserted);
  } catch (error) {
    await rollbackImage(image);
    throw error;
  }
}

function updateOptionalNutrient(
  inputValue: number | null | undefined,
  existingHundredths: number | null,
  ratio: number | null,
  isProduct: boolean,
) {
  if (!isProduct) return optionalHundredths(inputValue ?? undefined);
  return existingHundredths === null || ratio === null
    ? existingHundredths
    : Math.round(existingHundredths * ratio);
}

/**
 * Edits an owned log. Catalog-backed logs keep their name and scale their nutrition by the new
 * grams; custom logs take the entered values.
 */
export async function updateFoodLogRecord(
  userId: string,
  values: typeof updateFoodLogValuesType.infer,
  photo: File | null = null,
) {
  const [existing] = await db
    .select()
    .from(foodLogs)
    .where(and(eq(foodLogs.id, values.id), eq(foodLogs.userId, userId)))
    .limit(1);
  if (!existing) throw new ClientSafeError('Food log not found.');

  const action = values.imageAction ?? 'keep';
  if (existing.productId && (action !== 'keep' || photo)) {
    throw new ClientSafeError('Product-backed entries use the product photo.');
  }
  const image = await prepareImageAction(action, photo, userId);
  let imageUploadObjectId: string | null | undefined;
  if (action === 'replace') imageUploadObjectId = image?.asset.id ?? null;
  if (action === 'remove') imageUploadObjectId = null;

  try {
    const nextGrams = optionalHundredths(values.grams ?? undefined);
    const isProduct = existing.productId !== null;
    const ratio =
      isProduct && existing.gramsHundredths && nextGrams !== null
        ? nextGrams / existing.gramsHundredths
        : null;

    let kcalHundredths = toHundredths(values.kcal);
    if (isProduct) {
      kcalHundredths = existing.kcalHundredths;
      if (ratio !== null) kcalHundredths = Math.round(existing.kcalHundredths * ratio);
    }

    const [updated] = await db.transaction(async (tx) => {
      if (image) await tx.insert(uploadObjects).values(image.asset);
      return tx
        .update(foodLogs)
        .set({
          gramsHundredths: nextGrams,
          kcalHundredths,
          proteinHundredths: updateOptionalNutrient(
            values.protein,
            existing.proteinHundredths,
            ratio,
            isProduct,
          ),
          fatHundredths: updateOptionalNutrient(
            values.fat,
            existing.fatHundredths,
            ratio,
            isProduct,
          ),
          carbsHundredths: updateOptionalNutrient(
            values.carbs,
            existing.carbsHundredths,
            ratio,
            isProduct,
          ),
          imageUploadObjectId,
          name: isProduct ? existing.name : values.name.trim(),
          logDate: values.date,
        })
        .where(eq(foodLogs.id, existing.id))
        .returning();
    });

    if (!updated) throw new Error('Food log could not be updated.');
    return await withImage(updated);
  } catch (error) {
    await rollbackImage(image);
    throw error;
  }
}

export async function deleteFoodLogsRecord(userId: string, data: typeof foodLogIdsInputType.infer) {
  await db.delete(foodLogs).where(and(inArray(foodLogs.id, data.ids), eq(foodLogs.userId, userId)));
}

/** Moves the user's selected logs to another day, e.g. after logging dinner under the wrong date. */
export async function moveFoodLogsRecord(userId: string, data: typeof foodLogsDateInputType.infer) {
  await db
    .update(foodLogs)
    .set({ logDate: data.date })
    .where(and(inArray(foodLogs.id, data.ids), eq(foodLogs.userId, userId)));
}

/** Duplicates the user's selected logs onto another day, e.g. repeating yesterday's breakfast. */
export async function copyFoodLogsRecord(userId: string, data: typeof foodLogsDateInputType.infer) {
  const sources = await db
    .select()
    .from(foodLogs)
    .where(and(inArray(foodLogs.id, data.ids), eq(foodLogs.userId, userId)));
  if (sources.length === 0) throw new ClientSafeError('These products no longer exist.');

  const consumedAt = new Date();
  await db.insert(foodLogs).values(
    sources.map((source) => ({
      userId,
      productId: source.productId,
      imageUploadObjectId: source.imageUploadObjectId,
      name: source.name,
      gramsHundredths: source.gramsHundredths,
      kcalHundredths: source.kcalHundredths,
      proteinHundredths: source.proteinHundredths,
      fatHundredths: source.fatHundredths,
      carbsHundredths: source.carbsHundredths,
      logDate: data.date,
      consumedAt,
    })),
  );
}

/** Scales grams, kcal, and macros of the user's selected logs, e.g. ×2 after eating a second sandwich logged as ingredients. */
export async function multiplyFoodLogsRecord(
  userId: string,
  data: typeof multiplyFoodLogsInputType.infer,
) {
  const scaled = (column: AnyPgColumn) => sql<number>`round(${column} * ${data.factor}::numeric)`;
  await db
    .update(foodLogs)
    .set({
      gramsHundredths: scaled(foodLogs.gramsHundredths),
      kcalHundredths: scaled(foodLogs.kcalHundredths),
      proteinHundredths: scaled(foodLogs.proteinHundredths),
      fatHundredths: scaled(foodLogs.fatHundredths),
      carbsHundredths: scaled(foodLogs.carbsHundredths),
    })
    .where(and(inArray(foodLogs.id, data.ids), eq(foodLogs.userId, userId)));
}
