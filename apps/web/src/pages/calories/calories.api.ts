import { ArkErrors, type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createMiddleware, createServerFn } from '@tanstack/react-start';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { dateOnlyType } from '@/lib/dateOnly';
import { calorieGoals, foodLogs, foodProducts, uploadObjects } from '@veles/db/schema';
import { requireSession } from '@/lib/auth/getSession';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/lib/db';
import { downloadFile } from '@/lib/download/downloadFile';
import { log } from '@/lib/logger';
import { logMiddleware } from '@/lib/middleware/logMiddleware';
import { getOpenFoodFactsProduct, type OpenFoodFactsProduct } from '@/lib/openFoodFacts';
import { getStorageConfig } from '@/lib/storage/config';
import { TypedFormData } from '@/lib/typedFormData';
import {
  deletePreparedFoodImage,
  foodImageUrl,
  getFoodImageAssets,
  prepareFoodImage,
  type FoodImageAsset,
  type PreparedFoodImage,
} from './foodImages.server';
import {
  fromHundredths,
  HUNDREDTHS,
  isWithinKcalGoal,
  optionalHundredths,
  toCalorieGoal,
  toHundredths,
} from './calorieHelpers';
import { calorieWeekDates } from './calorieHelpers';

const MAX_TEXT_LENGTH = 500;
const FOOD_UPLOAD_MAX_REQUEST_BYTES = 12 * 1024 * 1024;

const nonNegativeAmountType = type('number >= 0').narrow((value, ctx) =>
  Number.isFinite(value) && Number.isSafeInteger(Math.round(value * HUNDREDTHS))
    ? true
    : ctx.mustBe('a finite number with at most two decimal places'),
);

const nonEmptyTextType = type(`string.trim |> 1 <= string <= ${MAX_TEXT_LENGTH}`);
const optionalNonEmptyTextType = nonEmptyTextType.or('null').or('undefined');
const optionalPositiveAmountType = type('number > 0 | null | undefined');
const optionalNonNegativeAmountType = nonNegativeAmountType.or('null').or('undefined');
const imageActionType = type("'keep' | 'replace' | 'remove'");
const formDataType = type('FormData');

const createFoodProductValuesType = type({
  name: nonEmptyTextType,
  'barcode?': optionalNonEmptyTextType,
  'productSizeGrams?': optionalPositiveAmountType,
  kcalPer100g: nonNegativeAmountType,
  'proteinPer100g?': optionalNonNegativeAmountType,
  'fatPer100g?': optionalNonNegativeAmountType,
  'carbsPer100g?': optionalNonNegativeAmountType,
  'imageAction?': imageActionType,
});
const updateFoodProductValuesType = createFoodProductValuesType.merge({ id: 'string.uuid' });
const foodLogIdInputType = type({ id: 'string.uuid' });

type CreateFoodProductValues = typeof createFoodProductValuesType.infer;
type ImageAction = typeof imageActionType.infer;

const limitFoodUploadRequestMiddleware = createMiddleware().server(async ({ next, request }) => {
  const contentLength = type('string.numeric.parse |> number.integer >= 0')(
    request.headers.get('content-length') ?? '',
  );
  if (contentLength instanceof type.errors || contentLength > FOOD_UPLOAD_MAX_REQUEST_BYTES) {
    throw new ClientSafeError('Upload request is too large.');
  }
  return next();
});

/** Validates the scalar payload and single photo before decoding or storing any bytes. */
function parseMultipartValues<T>(
  formData: FormData,
  valuesType: (input: unknown) => T | ArkErrors,
): { values: T; photo: File | null } {
  const typedFormData = new TypedFormData(formData);
  let encodedValues: string;
  try {
    encodedValues = typedFormData.string('values');
  } catch {
    throw new ClientSafeError('The food form is invalid.');
  }

  let decodedValues: unknown;
  try {
    decodedValues = JSON.parse(encodedValues);
  } catch {
    throw new ClientSafeError('The food form is invalid.');
  }

  const validation = valuesType(decodedValues);
  if (validation instanceof type.errors) {
    throw new ClientSafeError(validation.summary);
  }

  const photoValue = typedFormData.raw().get('photo');
  if (photoValue === null) return { photo: null, values: validation };
  if (!(photoValue instanceof File) || photoValue.size <= 0) {
    throw new ClientSafeError('The selected photo is invalid.');
  }

  return { photo: photoValue, values: validation };
}

function productValues(data: CreateFoodProductValues) {
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

function isPublicProductAsset(asset: FoodImageAsset | undefined) {
  if (!asset) return false;
  const { bucketName } = getStorageConfig();
  return Boolean(bucketName && asset.bucket === bucketName);
}

function toFoodProduct(
  product: typeof foodProducts.$inferSelect,
  asset: FoodImageAsset | undefined,
): CalorieFood {
  const publicAsset = isPublicProductAsset(asset) ? asset : undefined;
  return {
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    imageUrl: foodImageUrl(publicAsset),
    productSizeGrams: fromHundredths(product.productSizeGramsHundredths),
    kcalPer100g: product.kcalPer100gHundredths / HUNDREDTHS,
    proteinPer100g: fromHundredths(product.proteinPer100gHundredths),
    fatPer100g: fromHundredths(product.fatPer100gHundredths),
    carbsPer100g: fromHundredths(product.carbsPer100gHundredths),
  };
}

function toCalorieLog(
  logEntry: typeof foodLogs.$inferSelect,
  logAsset: FoodImageAsset | undefined,
  productAsset?: FoodImageAsset,
): CalorieLog {
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
    imageUrl: foodImageUrl(logAsset ?? productAsset),
  };
}

async function getProductImageIds(productIds: Array<string | null>) {
  const ids = [...new Set(productIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Map<string, string | null>();

  const products = await db
    .select({ id: foodProducts.id, imageUploadObjectId: foodProducts.imageUploadObjectId })
    .from(foodProducts)
    .where(inArray(foodProducts.id, ids));
  return new Map(products.map((product) => [product.id, product.imageUploadObjectId]));
}

function calorieTotalsForLogs(logs: (typeof foodLogs.$inferSelect)[]): CalorieTotals {
  const totals = logs.reduce(
    (result, logEntry) => ({
      kcal: result.kcal + logEntry.kcalHundredths,
      protein: result.protein + (logEntry.proteinHundredths ?? 0),
      fat: result.fat + (logEntry.fatHundredths ?? 0),
      carbs: result.carbs + (logEntry.carbsHundredths ?? 0),
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );

  return {
    kcal: totals.kcal / HUNDREDTHS,
    protein: fromHundredths(totals.protein),
    fat: fromHundredths(totals.fat),
    carbs: fromHundredths(totals.carbs),
  };
}

function latestGoalForDate(goals: (typeof calorieGoals.$inferSelect)[], date: string) {
  return goals.find((goal) => goal.effectiveDate <= date);
}

async function findFoodProductByBarcode(barcode: string) {
  const [product] = await db
    .select()
    .from(foodProducts)
    .where(eq(foodProducts.barcode, barcode))
    .limit(1);

  return product;
}

const barcodeUniqueIndexName = 'food_product_barcode_idx';

/** Recognizes the barcode constraint through Drizzle's wrapped PostgreSQL errors. */
function isBarcodeConflict(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  if (
    'code' in error &&
    error.code === '23505' &&
    'constraint' in error &&
    error.constraint === barcodeUniqueIndexName
  ) {
    return true;
  }

  return 'cause' in error && isBarcodeConflict(error.cause);
}

/** Imports metadata and its optional photo atomically; concurrent losers discard their upload. */
async function insertImportedFoodProduct(product: OpenFoodFactsProduct) {
  let image: PreparedFoodImage | null = null;
  if (product.imageUrl) {
    try {
      image = await prepareFoodImage(await downloadFile(product.imageUrl), {
        userId: null,
      });
    } catch {}
  }
  try {
    const inserted = await db.transaction(async (tx) => {
      if (image) await tx.insert(uploadObjects).values(image.asset);
      const [row] = await tx
        .insert(foodProducts)
        .values({
          ...productValues(product),
          imageUploadObjectId: image?.asset.id ?? null,
        })
        .onConflictDoNothing({ target: foodProducts.barcode })
        .returning();
      if (!row && image) await tx.delete(uploadObjects).where(eq(uploadObjects.id, image.asset.id));
      return row;
    });
    if (inserted) return inserted;
    await rollbackImage(image);
    return findFoodProductByBarcode(product.barcode);
  } catch (error) {
    await rollbackImage(image);
    throw error;
  }
}

async function prepareProductAction(
  action: ImageAction,
  photo: File | null,
  userId: string,
): Promise<PreparedFoodImage | null> {
  if (action === 'keep' || action === 'remove') return null;
  if (!photo) throw new ClientSafeError('Choose a photo before replacing the image.');

  return prepareFoodImage(photo, { userId });
}

async function prepareLogAction(action: ImageAction, photo: File | null, userId: string) {
  if (action === 'keep' || action === 'remove') return null;
  if (!photo) throw new ClientSafeError('Choose a photo before replacing the image.');

  return prepareFoodImage(photo, { userId });
}

/** Never roll back bytes after their asset transaction committed, even if response loading fails. */
async function rollbackImage(image: PreparedFoodImage | null) {
  if (!image) return;
  try {
    const [saved] = await db
      .select({ id: uploadObjects.id })
      .from(uploadObjects)
      .where(eq(uploadObjects.id, image.asset.id))
      .limit(1);
    if (!saved) await deletePreparedFoodImage(image);
  } catch (error) {
    log.error('Food image rollback failed', {
      key: image.key,
      bucket: image.bucket,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const dashboardInputType = type({ date: dateOnlyType });

export const getCalorieDashboard = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getCalorieDashboard')])
  .validator(arkTypeValidator(dashboardInputType))
  .handler(async ({ data }): Promise<CalorieDashboard> => {
    const session = await requireSession();
    const weekDates = calorieWeekDates(data.date);
    const [weekStart, weekEnd] = [weekDates[0], weekDates.at(-1)];

    if (!weekStart || !weekEnd) throw new Error('A calorie week must contain at least one day.');

    const [goals, logs] = await Promise.all([
      db
        .select()
        .from(calorieGoals)
        .where(
          and(eq(calorieGoals.userId, session.user.id), lte(calorieGoals.effectiveDate, weekEnd)),
        )
        .orderBy(desc(calorieGoals.effectiveDate)),
      db
        .select()
        .from(foodLogs)
        .where(
          and(
            eq(foodLogs.userId, session.user.id),
            gte(foodLogs.logDate, weekStart),
            lte(foodLogs.logDate, weekEnd),
          ),
        )
        .orderBy(desc(foodLogs.consumedAt)),
    ]);
    const productImageIds = await getProductImageIds(logs.map((entry) => entry.productId));
    const assetsById = await getFoodImageAssets([
      ...logs.map((entry) => entry.imageUploadObjectId),
      ...productImageIds.values(),
    ]);

    const logsByDate = new Map<string, (typeof foodLogs.$inferSelect)[]>();
    for (const logEntry of logs) {
      const dayLogs = logsByDate.get(logEntry.logDate);
      if (dayLogs) dayLogs.push(logEntry);
      else logsByDate.set(logEntry.logDate, [logEntry]);
    }

    const days = weekDates.map((date): CalorieDashboardDay => {
      const dayLogs = logsByDate.get(date) ?? [];
      const goal = latestGoalForDate(goals, date);
      const kcalHundredths = dayLogs.reduce(
        (total, logEntry) => total + logEntry.kcalHundredths,
        0,
      );

      return {
        date,
        goal: goal ? toCalorieGoal(goal) : null,
        logs: dayLogs.map((entry) => {
          const productImageId = entry.productId ? productImageIds.get(entry.productId) : null;
          return toCalorieLog(
            entry,
            assetsById.get(entry.imageUploadObjectId ?? ''),
            assetsById.get(productImageId ?? ''),
          );
        }),
        totals: calorieTotalsForLogs(dayLogs),
        hasLogs: dayLogs.length > 0,
        withinKcalGoal:
          dayLogs.length > 0 && goal
            ? isWithinKcalGoal(kcalHundredths, goal.kcalLimitHundredths)
            : null,
        overKcalGoal:
          dayLogs.length > 0 && goal ? kcalHundredths > goal.kcalLimitHundredths : false,
      };
    });

    return { days, weekStart };
  });

export type CalorieDashboard = {
  days: CalorieDashboardDay[];
  weekStart: string;
};

export type CalorieDashboardDay = {
  date: string;
  goal: CalorieGoal | null;
  logs: CalorieLog[];
  totals: CalorieTotals;
  hasLogs: boolean;
  withinKcalGoal: boolean | null;
  overKcalGoal: boolean;
};

export type CalorieFood = {
  id: string;
  name: string;
  barcode: string | null;
  imageUrl: string | null;
  productSizeGrams: number | null;
  kcalPer100g: number;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
};

export type CalorieGoal = {
  id: string;
  date: string;
  kcal: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

export type CalorieLog = {
  id: string;
  name: string;
  productId: string | null;
  date: string;
  consumedAt: string;
  grams: number | null;
  kcal: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  imageUrl: string | null;
};

export type CalorieTotals = {
  kcal: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

export const getFoodProducts = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getFoodProducts')])
  .handler(async () => {
    await requireSession();

    const foods = await db.select().from(foodProducts).orderBy(desc(foodProducts.updatedAt));
    const assetsById = await getFoodImageAssets(foods.map((food) => food.imageUploadObjectId));
    return foods.map((food) => toFoodProduct(food, assetsById.get(food.imageUploadObjectId ?? '')));
  });

export const getFoodProduct = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getFoodProduct')])
  .validator(arkTypeValidator(foodLogIdInputType))
  .handler(async ({ data }) => {
    await requireSession();

    const [food] = await db
      .select()
      .from(foodProducts)
      .where(eq(foodProducts.id, data.id))
      .limit(1);
    if (!food) throw new ClientSafeError('Food product not found.');

    const assetsById = await getFoodImageAssets([food.imageUploadObjectId]);
    return toFoodProduct(food, assetsById.get(food.imageUploadObjectId ?? ''));
  });

const barcodeInputType = type({ barcode: nonEmptyTextType });

export const lookupFoodByBarcode = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('lookupFoodByBarcode')])
  .validator(arkTypeValidator(barcodeInputType))
  .handler(async ({ data }) => {
    await requireSession();
    const barcode = data.barcode.trim();
    const existingProduct = await findFoodProductByBarcode(barcode);
    if (existingProduct) {
      const assetsById = await getFoodImageAssets([existingProduct.imageUploadObjectId]);
      return {
        food: toFoodProduct(
          existingProduct,
          assetsById.get(existingProduct.imageUploadObjectId ?? ''),
        ),
        status: 'found' as const,
      };
    }

    const importedProduct = await getOpenFoodFactsProduct(barcode);
    if (importedProduct === null) return { status: 'notFound' as const };

    const product = await insertImportedFoodProduct(importedProduct);
    if (!product) return { status: 'notFound' as const };
    const assetsById = await getFoodImageAssets([product.imageUploadObjectId]);
    return {
      food: toFoodProduct(product, assetsById.get(product.imageUploadObjectId ?? '')),
      status: 'found' as const,
    };
  });

export const createFoodProduct = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createFoodProduct'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const { values, photo } = parseMultipartValues(data, createFoodProductValuesType);
    const action = values.imageAction ?? 'keep';
    const image = await prepareProductAction(action, photo, session.user.id);

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

      const assetsById = await getFoodImageAssets([product.imageUploadObjectId]);
      return toFoodProduct(product, assetsById.get(product.imageUploadObjectId ?? ''));
    } catch (error) {
      await rollbackImage(image);
      if (isBarcodeConflict(error))
        throw new ClientSafeError('A food product with this barcode already exists.');
      throw error;
    }
  });

export const updateFoodProduct = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateFoodProduct'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const { values, photo } = parseMultipartValues(data, updateFoodProductValuesType);
    const [existing] = await db
      .select()
      .from(foodProducts)
      .where(eq(foodProducts.id, values.id))
      .limit(1);
    if (!existing) throw new ClientSafeError('Food product not found.');

    const action = values.imageAction ?? 'keep';
    if (action === 'replace' && existing.imageUploadObjectId) {
      throw new ClientSafeError('Remove the existing product photo before uploading another.');
    }
    const image = await prepareProductAction(action, photo, session.user.id);
    const imageUploadObjectId = action === 'keep' ? undefined : (image?.asset.id ?? null);

    try {
      const [product] = await db.transaction(async (tx) => {
        if (image) await tx.insert(uploadObjects).values(image.asset);
        return tx
          .update(foodProducts)
          .set({
            ...productValues(values),
            imageUploadObjectId,
            updatedAt: new Date(),
          })
          .where(eq(foodProducts.id, values.id))
          .returning();
      });
      if (!product) throw new ClientSafeError('Food product not found.');

      const assetsById = await getFoodImageAssets([product.imageUploadObjectId]);
      return toFoodProduct(product, assetsById.get(product.imageUploadObjectId ?? ''));
    } catch (error) {
      await rollbackImage(image);
      if (isBarcodeConflict(error))
        throw new ClientSafeError('A food product with this barcode already exists.');
      throw error;
    }
  });

const recordFoodValuesType = type({
  date: dateOnlyType,
  grams: nonNegativeAmountType,
  productId: 'string.uuid',
});

export const recordFood = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('recordFood'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const { values, photo } = parseMultipartValues(data, recordFoodValuesType);
    if (photo) throw new ClientSafeError('Product-backed entries use the product photo.');

    const [product] = await db
      .select()
      .from(foodProducts)
      .where(eq(foodProducts.id, values.productId))
      .limit(1);
    if (!product) throw new ClientSafeError('The selected food product no longer exists.');

    const productAssets = await getFoodImageAssets([product.imageUploadObjectId]);
    const productAsset = productAssets.get(product.imageUploadObjectId ?? '');
    const imageUploadObjectId =
      productAsset && isPublicProductAsset(productAsset) ? productAsset.id : null;

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
        userId: session.user.id,
      })
      .returning();

    if (!inserted) throw new Error('Food log could not be created.');
    const assetsById = await getFoodImageAssets([inserted.imageUploadObjectId]);
    return toCalorieLog(inserted, assetsById.get(inserted.imageUploadObjectId ?? ''));
  });

const recordCustomCaloriesValuesType = type({
  name: nonEmptyTextType,
  'grams?': optionalNonNegativeAmountType,
  kcal: nonNegativeAmountType,
  'protein?': optionalNonNegativeAmountType,
  'fat?': optionalNonNegativeAmountType,
  'carbs?': optionalNonNegativeAmountType,
  date: dateOnlyType,
  'imageAction?': imageActionType,
});

export const recordCustomCalories = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('recordCustomCalories'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const { values, photo } = parseMultipartValues(data, recordCustomCaloriesValuesType);
    const action = values.imageAction ?? 'keep';
    const image = await prepareLogAction(action, photo, session.user.id);

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
            userId: session.user.id,
          })
          .returning();
      });

      if (!inserted) throw new Error('Food log could not be created.');
      const assetsById = await getFoodImageAssets([inserted.imageUploadObjectId]);
      return toCalorieLog(inserted, assetsById.get(inserted.imageUploadObjectId ?? ''));
    } catch (error) {
      await rollbackImage(image);
      throw error;
    }
  });

export const getFoodLog = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getFoodLog')])
  .validator(arkTypeValidator(foodLogIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [entry] = await db
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.id, data.id), eq(foodLogs.userId, session.user.id)))
      .limit(1);
    if (!entry) throw new ClientSafeError('Food log not found.');

    const productImageIds = await getProductImageIds([entry.productId]);
    const productImageId = entry.productId ? productImageIds.get(entry.productId) : null;
    const assetsById = await getFoodImageAssets([entry.imageUploadObjectId, productImageId]);
    return toCalorieLog(
      entry,
      assetsById.get(entry.imageUploadObjectId ?? ''),
      assetsById.get(productImageId ?? ''),
    );
  });

const updateFoodLogValuesType = type({
  id: 'string.uuid',
  name: nonEmptyTextType,
  'grams?': optionalNonNegativeAmountType,
  kcal: nonNegativeAmountType,
  'protein?': optionalNonNegativeAmountType,
  'fat?': optionalNonNegativeAmountType,
  'carbs?': optionalNonNegativeAmountType,
  date: dateOnlyType,
  'imageAction?': imageActionType,
});

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

export const updateFoodLog = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateFoodLog'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(formDataType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const { values, photo } = parseMultipartValues(data, updateFoodLogValuesType);

    const [existing] = await db
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.id, values.id), eq(foodLogs.userId, session.user.id)))
      .limit(1);
    if (!existing) throw new ClientSafeError('Food log not found.');

    const action = values.imageAction ?? 'keep';
    if (existing.productId && (action !== 'keep' || photo)) {
      throw new ClientSafeError('Product-backed entries use the product photo.');
    }
    const image = await prepareLogAction(action, photo, session.user.id);
    const imageUploadObjectId =
      action === 'replace' ? (image?.asset.id ?? null) : action === 'remove' ? null : undefined;

    try {
      const nextGrams = optionalHundredths(values.grams ?? undefined);
      const isProduct = existing.productId !== null;
      const ratio =
        isProduct && existing.gramsHundredths && nextGrams !== null
          ? nextGrams / existing.gramsHundredths
          : null;

      const [updated] = await db.transaction(async (tx) => {
        if (image) await tx.insert(uploadObjects).values(image.asset);
        return tx
          .update(foodLogs)
          .set({
            gramsHundredths: nextGrams,
            kcalHundredths: isProduct
              ? ratio === null
                ? existing.kcalHundredths
                : Math.round(existing.kcalHundredths * ratio)
              : toHundredths(values.kcal),
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
      const assetsById = await getFoodImageAssets([updated.imageUploadObjectId]);
      return toCalorieLog(updated, assetsById.get(updated.imageUploadObjectId ?? ''));
    } catch (error) {
      await rollbackImage(image);
      throw error;
    }
  });

export const deleteFoodLog = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteFoodLog')])
  .validator(arkTypeValidator(foodLogIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db
      .delete(foodLogs)
      .where(and(eq(foodLogs.id, data.id), eq(foodLogs.userId, session.user.id)));
  });
