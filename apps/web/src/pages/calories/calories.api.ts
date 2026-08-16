import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, ilike, lte } from 'drizzle-orm';
import { dateOnlyType } from '@/lib/dateOnly';
import { calorieGoals, foodLogs, foodProducts } from '@veles/db/schema';
import { requireSession } from '@/lib/auth/getSession';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/lib/db';
import { logMiddleware } from '@/lib/middleware/logMiddleware';
import { getOpenFoodFactsProduct, type OpenFoodFactsProduct } from '@/lib/openFoodFacts';
import {
  fromHundredths,
  HUNDREDTHS,
  optionalHundredths,
  toCalorieGoal,
  toHundredths,
} from './calorieHelpers';

const MAX_TEXT_LENGTH = 500;

const nonNegativeAmountType = type('number >= 0').narrow((value, ctx) =>
  Number.isFinite(value) && Number.isSafeInteger(Math.round(value * HUNDREDTHS))
    ? true
    : ctx.mustBe('a finite number with at most two decimal places'),
);

const nonEmptyTextType = type(`string.trim |> 1 <= string <= ${MAX_TEXT_LENGTH}`);

const createFoodProductInputType = type({
  name: nonEmptyTextType,
  'brand?': nonEmptyTextType,
  'barcode?': nonEmptyTextType,
  'imageUrl?': type('string.url'),
  'productSizeGrams?': type('number > 0'),
  kcalPer100g: nonNegativeAmountType,
  'proteinPer100g?': nonNegativeAmountType,
  'fatPer100g?': nonNegativeAmountType,
  'carbsPer100g?': nonNegativeAmountType,
});
const foodIdInputType = type({ id: 'string.uuid' });
const updateFoodProductInputType = createFoodProductInputType.merge(foodIdInputType);
const foodLogIdInputType = type({ id: 'string.uuid' });

function productValues(data: typeof createFoodProductInputType.infer) {
  return {
    name: data.name.trim(),
    brand: data.brand?.trim() ?? null,
    barcode: data.barcode?.trim() ?? null,
    imageUrl: data.imageUrl ?? null,
    productSizeGramsHundredths: optionalHundredths(data.productSizeGrams),
    kcalPer100gHundredths: toHundredths(data.kcalPer100g),
    proteinPer100gHundredths: optionalHundredths(data.proteinPer100g),
    fatPer100gHundredths: optionalHundredths(data.fatPer100g),
    carbsPer100gHundredths: optionalHundredths(data.carbsPer100g),
  };
}

function toFoodProduct(product: typeof foodProducts.$inferSelect) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    barcode: product.barcode,
    imageUrl: product.imageUrl,
    productSizeGrams: fromHundredths(product.productSizeGramsHundredths),
    kcalPer100g: product.kcalPer100gHundredths / HUNDREDTHS,
    proteinPer100g: fromHundredths(product.proteinPer100gHundredths),
    fatPer100g: fromHundredths(product.fatPer100gHundredths),
    carbsPer100g: fromHundredths(product.carbsPer100gHundredths),
  };
}

function toCalorieLog(log: typeof foodLogs.$inferSelect) {
  return {
    id: log.id,
    name: log.name,
    productId: log.productId,
    date: log.logDate,
    consumedAt: log.consumedAt.toISOString(),
    grams: fromHundredths(log.gramsHundredths),
    kcal: log.kcalHundredths / HUNDREDTHS,
    protein: fromHundredths(log.proteinHundredths),
    fat: fromHundredths(log.fatHundredths),
    carbs: fromHundredths(log.carbsHundredths),
  };
}

async function findFoodProductByBarcode(barcode: string) {
  const [product] = await db
    .select()
    .from(foodProducts)
    .where(eq(foodProducts.barcode, barcode))
    .limit(1);

  return product;
}

async function insertImportedFoodProduct(product: OpenFoodFactsProduct) {
  const [inserted] = await db
    .insert(foodProducts)
    .values({
      name: product.name,
      brand: product.brand,
      barcode: product.barcode,
      imageUrl: product.imageUrl,
      productSizeGramsHundredths: optionalHundredths(product.productSizeGrams ?? undefined),
      kcalPer100gHundredths: toHundredths(product.kcalPer100g),
      proteinPer100gHundredths: optionalHundredths(product.proteinPer100g ?? undefined),
      fatPer100gHundredths: optionalHundredths(product.fatPer100g ?? undefined),
      carbsPer100gHundredths: optionalHundredths(product.carbsPer100g ?? undefined),
    })
    .onConflictDoNothing({ target: foodProducts.barcode })
    .returning();

  return inserted ?? (await findFoodProductByBarcode(product.barcode));
}

const dashboardInputType = type({ date: dateOnlyType });

export const getCalorieDashboard = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getCalorieDashboard')])
  .validator(arkTypeValidator(dashboardInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const [goal] = await db
      .select()
      .from(calorieGoals)
      .where(
        and(eq(calorieGoals.userId, session.user.id), lte(calorieGoals.effectiveDate, data.date)),
      )
      .orderBy(desc(calorieGoals.effectiveDate))
      .limit(1);

    const logs = await db
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, session.user.id), eq(foodLogs.logDate, data.date)))
      .orderBy(desc(foodLogs.consumedAt));

    const recentFoods = await db
      .select()
      .from(foodProducts)
      .orderBy(desc(foodProducts.createdAt), desc(foodProducts.id))
      .limit(20);

    const totals = logs.reduce(
      (result, log) => ({
        kcal: result.kcal + log.kcalHundredths,
        protein: result.protein + (log.proteinHundredths ?? 0),
        fat: result.fat + (log.fatHundredths ?? 0),
        carbs: result.carbs + (log.carbsHundredths ?? 0),
      }),
      { kcal: 0, protein: 0, fat: 0, carbs: 0 },
    );

    return {
      date: data.date,
      goal: goal ? toCalorieGoal(goal) : null,
      logs: logs.map(toCalorieLog),
      recentFoods: recentFoods.map(toFoodProduct),
      totals: {
        kcal: totals.kcal / HUNDREDTHS,
        protein: fromHundredths(totals.protein),
        fat: fromHundredths(totals.fat),
        carbs: fromHundredths(totals.carbs),
      },
    };
  });

const searchFoodsInputType = type({ query: 'string.trim' });

export const searchFoods = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('searchFoods')])
  .validator(arkTypeValidator(searchFoodsInputType))
  .handler(async ({ data }) => {
    await requireSession();

    const query = data.query.trim();

    const foods = await db
      .select()
      .from(foodProducts)
      .where(query ? ilike(foodProducts.name, `%${query}%`) : undefined)
      .orderBy(desc(foodProducts.updatedAt))
      .limit(30);

    return foods.map(toFoodProduct);
  });

export const getFoodProduct = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getFoodProduct')])
  .validator(arkTypeValidator(foodIdInputType))
  .handler(async ({ data }) => {
    await requireSession();

    const [food] = await db
      .select()
      .from(foodProducts)
      .where(eq(foodProducts.id, data.id))
      .limit(1);

    if (!food) throw new ClientSafeError('Food product not found.');

    return toFoodProduct(food);
  });

const barcodeInputType = type({ barcode: nonEmptyTextType });

export const lookupFoodByBarcode = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('lookupFoodByBarcode')])
  .validator(arkTypeValidator(barcodeInputType))
  .handler(async ({ data }) => {
    await requireSession();

    const barcode = data.barcode.trim();

    const existingProduct = await findFoodProductByBarcode(barcode);
    if (existingProduct) return { food: toFoodProduct(existingProduct), status: 'found' };

    const importedProduct = await getOpenFoodFactsProduct(barcode);
    if (importedProduct === null) return { status: 'notFound' };

    const product = await insertImportedFoodProduct(importedProduct);
    return product ? { food: toFoodProduct(product), status: 'found' } : { status: 'notFound' };
  });

export const createFoodProduct = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createFoodProduct')])
  .validator(arkTypeValidator(createFoodProductInputType))
  .handler(async ({ data }) => {
    await requireSession();

    const values = productValues(data);

    const [inserted] = await db
      .insert(foodProducts)
      .values(values)
      .onConflictDoNothing({ target: foodProducts.barcode })
      .returning();

    const product =
      inserted ??
      (values.barcode === null ? undefined : await findFoodProductByBarcode(values.barcode));
    if (!product) throw new ClientSafeError('A food product with this barcode already exists.');

    return toFoodProduct(product);
  });

export const updateFoodProduct = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateFoodProduct')])
  .validator(arkTypeValidator(updateFoodProductInputType))
  .handler(async ({ data }) => {
    await requireSession();

    const [updated] = await db
      .update(foodProducts)
      .set({ ...productValues(data), updatedAt: new Date() })
      .where(eq(foodProducts.id, data.id))
      .returning();

    if (!updated) throw new ClientSafeError('Food product not found.');

    return toFoodProduct(updated);
  });

const recordFoodInputType = type({
  date: dateOnlyType,
  grams: nonNegativeAmountType,
  productId: 'string.uuid',
});

export const recordFood = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('recordFood')])
  .validator(arkTypeValidator(recordFoodInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const [product] = await db
      .select()
      .from(foodProducts)
      .where(eq(foodProducts.id, data.productId))
      .limit(1);

    if (!product) throw new ClientSafeError('The selected food product no longer exists.');

    const gramsHundredths = toHundredths(data.grams);
    const scale = (value: number | null) =>
      value === null ? null : Math.round((value * gramsHundredths) / (100 * HUNDREDTHS));

    const [inserted] = await db
      .insert(foodLogs)
      .values({
        name: product.name,
        productId: product.id,
        gramsHundredths,
        kcalHundredths: scale(product.kcalPer100gHundredths) ?? 0,
        proteinHundredths: scale(product.proteinPer100gHundredths),
        fatHundredths: scale(product.fatPer100gHundredths),
        carbsHundredths: scale(product.carbsPer100gHundredths),
        logDate: data.date,
        consumedAt: new Date(),
        userId: session.user.id,
      })
      .returning();

    if (!inserted) throw new Error('Food log could not be created.');

    return toCalorieLog(inserted);
  });

const recordCustomCaloriesInputType = type({
  name: nonEmptyTextType,
  'grams?': nonNegativeAmountType,
  kcal: nonNegativeAmountType,
  'protein?': nonNegativeAmountType,
  'fat?': nonNegativeAmountType,
  'carbs?': nonNegativeAmountType,
  date: dateOnlyType,
});

export const recordCustomCalories = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('recordCustomCalories')])
  .validator(arkTypeValidator(recordCustomCaloriesInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const [inserted] = await db
      .insert(foodLogs)
      .values({
        name: data.name.trim(),
        productId: null,
        gramsHundredths: optionalHundredths(data.grams),
        kcalHundredths: toHundredths(data.kcal),
        proteinHundredths: optionalHundredths(data.protein),
        fatHundredths: optionalHundredths(data.fat),
        carbsHundredths: optionalHundredths(data.carbs),
        logDate: data.date,
        consumedAt: new Date(),
        userId: session.user.id,
      })
      .returning();

    if (!inserted) throw new Error('Food log could not be created.');

    return toCalorieLog(inserted);
  });

export const getFoodLog = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getFoodLog')])
  .validator(arkTypeValidator(foodLogIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const [log] = await db
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.id, data.id), eq(foodLogs.userId, session.user.id)))
      .limit(1);

    if (!log) throw new ClientSafeError('Food log not found.');

    return toCalorieLog(log);
  });

const updateFoodLogInputType = type({
  id: 'string.uuid',
  name: nonEmptyTextType,
  'grams?': nonNegativeAmountType,
  kcal: nonNegativeAmountType,
  'protein?': nonNegativeAmountType,
  'fat?': nonNegativeAmountType,
  'carbs?': nonNegativeAmountType,
  date: dateOnlyType,
});

function updateOptionalNutrient(
  inputValue: number | undefined,
  existingHundredths: number | null,
  ratio: number | null,
) {
  if (ratio === null) return optionalHundredths(inputValue);
  return existingHundredths === null ? null : Math.round(existingHundredths * ratio);
}

export const updateFoodLog = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateFoodLog')])
  .validator(arkTypeValidator(updateFoodLogInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const [existing] = await db
      .select()
      .from(foodLogs)
      .where(and(eq(foodLogs.id, data.id), eq(foodLogs.userId, session.user.id)))
      .limit(1);

    if (!existing) throw new ClientSafeError('Food log not found.');

    const nextGrams = optionalHundredths(data.grams);
    const ratio =
      existing.productId !== null && existing.gramsHundredths && nextGrams !== null
        ? nextGrams / existing.gramsHundredths
        : null;

    const [updated] = await db
      .update(foodLogs)
      .set({
        gramsHundredths: nextGrams,
        kcalHundredths:
          ratio === null ? toHundredths(data.kcal) : Math.round(existing.kcalHundredths * ratio),
        proteinHundredths: updateOptionalNutrient(data.protein, existing.proteinHundredths, ratio),
        fatHundredths: updateOptionalNutrient(data.fat, existing.fatHundredths, ratio),
        carbsHundredths: updateOptionalNutrient(data.carbs, existing.carbsHundredths, ratio),
        name: existing.productId === null ? data.name.trim() : existing.name,
        logDate: data.date,
      })
      .where(eq(foodLogs.id, existing.id))
      .returning();

    if (!updated) throw new Error('Food log could not be updated.');

    return toCalorieLog(updated);
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
