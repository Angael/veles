import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { foodLogs, foodProducts, uploadObjects } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { fromHundredths, HUNDREDTHS, optionalHundredths, toHundredths } from '@/lib/nutrition';
import { db } from '@/server/db.server';
import { downloadFile } from '@/server/downloadFile.server';
import { storagePathToUrl } from '@/server/storage/config.server';
import type { CalorieFood } from './calories.api';
import type {
  barcodeInputType,
  createFoodProductValuesType,
  saveFoodProductInputType,
  updateFoodProductValuesType,
} from './calories.validation';
import { foodBarcodeAliases } from './foodBarcode';
import {
  getFoodImageAssets,
  prepareFoodImage,
  prepareImageAction,
  type PreparedFoodImage,
  rollbackImage,
} from './foodImages.server';
import { getOpenFoodFactsProduct, type OpenFoodFactsProduct } from './openFoodFacts';
import { translate } from '@/lib/i18n/getLocale';

function productValues(data: typeof createFoodProductValuesType.infer) {
  return {
    name: data.name.trim(),
    barcode: data.barcode?.trim() ?? null,
    productSizeGramsHundredths: optionalHundredths(data.productSizeGrams ?? undefined),
    kcalPer100gHundredths: toHundredths(data.kcalPer100g),
    proteinPer100gHundredths: optionalHundredths(data.proteinPer100g ?? undefined),
    fatPer100gHundredths: optionalHundredths(data.fatPer100g ?? undefined),
    carbsPer100gHundredths: optionalHundredths(data.carbsPer100g ?? undefined),
  };
}

export function toFoodProduct(
  product: typeof foodProducts.$inferSelect,
  asset: typeof uploadObjects.$inferSelect | undefined,
): CalorieFood {
  return {
    id: product.id,
    name: product.name,
    namePl: product.namePl,
    barcode: product.barcode,
    imageUrl: asset ? storagePathToUrl(asset.key) : null,
    productSizeGrams: fromHundredths(product.productSizeGramsHundredths),
    kcalPer100g: product.kcalPer100gHundredths / HUNDREDTHS,
    proteinPer100g: fromHundredths(product.proteinPer100gHundredths),
    fatPer100g: fromHundredths(product.fatPer100gHundredths),
    carbsPer100g: fromHundredths(product.carbsPer100gHundredths),
  };
}

async function withImage(product: typeof foodProducts.$inferSelect) {
  const assetsById = await getFoodImageAssets([product.imageUploadObjectId]);
  return toFoodProduct(product, assetsById.get(product.imageUploadObjectId ?? ''));
}

/** Matches equivalent GTIN padding while preferring the exact barcode if older duplicates exist. */
async function findFoodProductByBarcode(barcode: string) {
  const [product] = await db
    .select()
    .from(foodProducts)
    .where(inArray(foodProducts.barcode, foodBarcodeAliases(barcode)))
    .orderBy(sql`case when ${foodProducts.barcode} = ${barcode} then 0 else 1 end`)
    .limit(1);

  return product;
}

/** Imports metadata and its optional photo atomically. */
async function insertImportedFoodProduct(product: OpenFoodFactsProduct) {
  let image: PreparedFoodImage | null = null;
  if (product.imageUrl) {
    try {
      image = await prepareFoodImage(await downloadFile(product.imageUrl), null);
    } catch {}
  }
  try {
    return await db.transaction(async (tx) => {
      if (image) await tx.insert(uploadObjects).values(image.asset);
      const [row] = await tx
        .insert(foodProducts)
        .values({
          ...productValues(product),
          imageUploadObjectId: image?.asset.id ?? null,
        })
        .returning();
      if (!row) throw new Error('A food product could not be created.');
      return row;
    });
  } catch (error) {
    await rollbackImage(image);
    throw error;
  }
}

/** Finds a catalog product by barcode, importing it from Open Food Facts when it is missing. */
export async function lookupFoodByBarcodeRecord(
  _userId: string,
  data: typeof barcodeInputType.infer,
) {
  const barcode = data.barcode.trim();
  const existingProduct = await findFoodProductByBarcode(barcode);
  if (existingProduct) return { food: await withImage(existingProduct), status: 'found' as const };

  const importedProduct = await getOpenFoodFactsProduct(barcode);
  if (importedProduct === null) return { status: 'notFound' as const };

  const product = await insertImportedFoodProduct(importedProduct);
  return { food: await withImage(product), status: 'found' as const };
}

/** Adds a shared catalog product; barcodes stay unique across GTIN padding. */
export async function createFoodProductRecord(
  userId: string,
  values: typeof createFoodProductValuesType.infer,
  photo: File | null = null,
) {
  if (values.barcode && (await findFoodProductByBarcode(values.barcode))) {
    throw new ClientSafeError(
      translate({
        en: 'A food product with this barcode already exists.',
        pl: 'Produkt z tym kodem kreskowym już istnieje.',
      }),
    );
  }
  const action = values.imageAction ?? 'keep';
  const image = await prepareImageAction(action, photo, userId);

  try {
    const [product] = await db.transaction(async (tx) => {
      if (image) await tx.insert(uploadObjects).values(image.asset);
      return tx
        .insert(foodProducts)
        .values({
          ...productValues(values),
          imageUploadObjectId: image?.asset.id ?? null,
        })
        .returning();
    });
    if (!product) throw new Error('A food product could not be created.');

    return await withImage(product);
  } catch (error) {
    await rollbackImage(image);
    throw error;
  }
}

/** Saves the product and refreshes all users' matching logs for the editor's local today atomically. */
export async function updateFoodProductRecord(
  userId: string,
  values: typeof updateFoodProductValuesType.infer,
  photo: File | null = null,
) {
  const [existing] = await db
    .select()
    .from(foodProducts)
    .where(eq(foodProducts.id, values.id))
    .limit(1);
  if (!existing)
    throw new ClientSafeError(
      translate({ en: 'Food product not found.', pl: 'Nie znaleziono produktu.' }),
    );
  if (values.barcode) {
    const barcodeProduct = await findFoodProductByBarcode(values.barcode);
    if (barcodeProduct && barcodeProduct.id !== values.id) {
      throw new ClientSafeError(
        translate({
          en: 'A food product with this barcode already exists.',
          pl: 'Produkt z tym kodem kreskowym już istnieje.',
        }),
      );
    }
  }

  const action = values.imageAction ?? 'keep';
  if (action === 'replace' && existing.imageUploadObjectId) {
    throw new ClientSafeError(
      translate({
        en: 'Remove the existing product photo before uploading another.',
        pl: 'Usuń obecne zdjęcie produktu przed przesłaniem nowego.',
      }),
    );
  }
  const image = await prepareImageAction(action, photo, userId);
  const imageUploadObjectId = action === 'keep' ? undefined : (image?.asset.id ?? null);

  try {
    const product = await db.transaction(async (tx) => {
      if (image) await tx.insert(uploadObjects).values(image.asset);
      const [updated] = await tx
        .update(foodProducts)
        .set({
          ...productValues(values),
          imageUploadObjectId,
          updatedAt: new Date(),
        })
        .where(eq(foodProducts.id, values.id))
        .returning();
      if (!updated)
        throw new ClientSafeError(
          translate({ en: 'Food product not found.', pl: 'Nie znaleziono produktu.' }),
        );

      const scale = (value: number | null) =>
        value === null
          ? null
          : sql<number>`round(${value}::numeric * ${foodLogs.gramsHundredths} / ${100 * HUNDREDTHS})`;
      await tx
        .update(foodLogs)
        .set({
          kcalHundredths: scale(updated.kcalPer100gHundredths) ?? 0,
          proteinHundredths: scale(updated.proteinPer100gHundredths),
          fatHundredths: scale(updated.fatPer100gHundredths),
          carbsHundredths: scale(updated.carbsPer100gHundredths),
        })
        .where(
          and(
            eq(foodLogs.productId, updated.id),
            eq(foodLogs.logDate, values.today),
            isNotNull(foodLogs.gramsHundredths),
          ),
        );
      return updated;
    });

    return await withImage(product);
  } catch (error) {
    await rollbackImage(image);
    throw error;
  }
}

/** Creates a product without id, or replaces the product's fields with id (needs `today`). */
export async function saveFoodProductRecord(
  userId: string,
  { id, today, ...values }: typeof saveFoodProductInputType.infer,
) {
  if (!id) return createFoodProductRecord(userId, values);
  if (!today) throw new ClientSafeError('Updating a product needs today.');
  return updateFoodProductRecord(userId, { ...values, id, today });
}
