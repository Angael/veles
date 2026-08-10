import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, ilike, lte } from 'drizzle-orm';
import { dateOnlyType } from '@/lib/dateOnly';
import { calorieGoals, foodLogs, foodProducts, type FoodProductSource } from '@veles/db/schema';
import { requireSession } from '@/lib/auth/getSession';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/lib/db';
import { logMiddleware } from '@/lib/middleware/logMiddleware';
import { getOpenFoodFactsProduct, type OpenFoodFactsProduct } from '@/lib/openFoodFacts';

const HUNDREDTHS = 100;
const MAX_TEXT_LENGTH = 500;

const nonNegativeAmountType = type('number >= 0').narrow((value, ctx) =>
  Number.isFinite(value) && Number.isSafeInteger(Math.round(value * HUNDREDTHS))
    ? true
    : ctx.mustBe('a finite number with at most two decimal places'),
);

const nonEmptyTextType = type(`string.trim |> 1 <= string <= ${MAX_TEXT_LENGTH}`);

const dashboardInputType = type({ date: dateOnlyType });
const barcodeInputType = type({ barcode: nonEmptyTextType });
const createFoodProductInputType = type({
  'barcode?': nonEmptyTextType,
  'brand?': nonEmptyTextType,
  'carbsPer100g?': nonNegativeAmountType,
  'fatPer100g?': nonNegativeAmountType,
  'imageUrl?': type('string.url'),
  kcalPer100g: nonNegativeAmountType,
  name: nonEmptyTextType,
  'proteinPer100g?': nonNegativeAmountType,
  'productSizeGrams?': type('number > 0'),
});
const recordFoodInputType = type({
  date: dateOnlyType,
  grams: nonNegativeAmountType,
  productId: 'string.uuid',
});
const recordCustomCaloriesInputType = type({
  'carbs?': nonNegativeAmountType,
  date: dateOnlyType,
  'fat?': nonNegativeAmountType,
  'grams?': nonNegativeAmountType,
  kcal: nonNegativeAmountType,
  name: nonEmptyTextType,
  'protein?': nonNegativeAmountType,
});
const setDailyCalorieGoalInputType = type({
  'carbs?': type('number > 0'),
  date: dateOnlyType,
  'fat?': type('number > 0'),
  kcal: type('number > 0'),
  'protein?': type('number > 0'),
});
const searchFoodsInputType = type({ query: 'string.trim' });
const foodIdInputType = type({ id: 'string.uuid' });
const updateFoodProductInputType = createFoodProductInputType.merge(foodIdInputType);
const foodLogIdInputType = type({ id: 'string.uuid' });
const updateFoodLogInputType = type({
  'carbs?': nonNegativeAmountType,
  date: dateOnlyType,
  'fat?': nonNegativeAmountType,
  'grams?': nonNegativeAmountType,
  id: 'string.uuid',
  kcal: nonNegativeAmountType,
  name: nonEmptyTextType,
  'protein?': nonNegativeAmountType,
});

function toHundredths(value: number): number {
  const scaled = Math.round(value * HUNDREDTHS);

  if (!Number.isSafeInteger(scaled)) {
    throw new ClientSafeError('Nutrition values are outside the supported range.');
  }

  return scaled;
}

function fromHundredths(value: number | null): number | null {
  return value === null ? null : value / HUNDREDTHS;
}

function optionalHundredths(value: number | undefined): number | null {
  return value === undefined ? null : toHundredths(value);
}

function productValues(data: typeof createFoodProductInputType.infer) {
  return {
    barcode: data.barcode?.trim() ?? null,
    brand: data.brand?.trim() ?? null,
    carbsPer100gHundredths: optionalHundredths(data.carbsPer100g),
    fatPer100gHundredths: optionalHundredths(data.fatPer100g),
    imageUrl: data.imageUrl ?? null,
    kcalPer100gHundredths: toHundredths(data.kcalPer100g),
    name: data.name.trim(),
    productSizeGramsHundredths: optionalHundredths(data.productSizeGrams),
    proteinPer100gHundredths: optionalHundredths(data.proteinPer100g),
  };
}

function sourceFromDatabase(value: string): FoodProductSource {
  if (value === 'open_food_facts') {
    return value;
  }

  if (value === 'veles') {
    return value;
  }

  throw new Error(`Unsupported food product source: ${value}`);
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
    carbsPer100g: fromHundredths(product.carbsPer100gHundredths),
    fatPer100g: fromHundredths(product.fatPer100gHundredths),
    source: sourceFromDatabase(product.source),
  };
}

function toCalorieLog(log: typeof foodLogs.$inferSelect) {
  return {
    id: log.id,
    name: log.name,
    kind: log.kind === 'product' ? ('product' as const) : ('custom' as const),
    productId: log.productId,
    date: log.logDate,
    consumedAt: log.consumedAt.toISOString(),
    grams: fromHundredths(log.gramsHundredths),
    kcal: log.kcalHundredths / HUNDREDTHS,
    protein: fromHundredths(log.proteinHundredths),
    carbs: fromHundredths(log.carbsHundredths),
    fat: fromHundredths(log.fatHundredths),
  };
}

function toCalorieGoal(goal: typeof calorieGoals.$inferSelect) {
  return {
    id: goal.id,
    date: goal.effectiveDate,
    kcal: goal.kcalLimitHundredths / HUNDREDTHS,
    protein: fromHundredths(goal.proteinLimitHundredths),
    carbs: fromHundredths(goal.carbsLimitHundredths),
    fat: fromHundredths(goal.fatLimitHundredths),
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
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      imageUrl: product.imageUrl,
      productSizeGramsHundredths: optionalHundredths(product.productSizeGrams ?? undefined),
      kcalPer100gHundredths: toHundredths(product.kcalPer100g),
      proteinPer100gHundredths: optionalHundredths(product.proteinPer100g ?? undefined),
      carbsPer100gHundredths: optionalHundredths(product.carbsPer100g ?? undefined),
      fatPer100gHundredths: optionalHundredths(product.fatPer100g ?? undefined),
      source: 'open_food_facts',
    })
    .onConflictDoNothing({ target: foodProducts.barcode })
    .returning();

  return inserted ?? (await findFoodProductByBarcode(product.barcode));
}

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
        carbs: result.carbs + (log.carbsHundredths ?? 0),
        fat: result.fat + (log.fatHundredths ?? 0),
        kcal: result.kcal + log.kcalHundredths,
        protein: result.protein + (log.proteinHundredths ?? 0),
      }),
      { carbs: 0, fat: 0, kcal: 0, protein: 0 },
    );

    return {
      date: data.date,
      goal: goal ? toCalorieGoal(goal) : null,
      logs: logs.map(toCalorieLog),
      recentFoods: recentFoods.map(toFoodProduct),
      totals: {
        kcal: totals.kcal / HUNDREDTHS,
        protein: fromHundredths(totals.protein),
        carbs: fromHundredths(totals.carbs),
        fat: fromHundredths(totals.fat),
      },
    };
  });

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
      .values({ ...values, source: 'veles' })
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
      .set({ ...productValues(data), source: 'veles', updatedAt: new Date() })
      .where(eq(foodProducts.id, data.id))
      .returning();
    if (!updated) throw new ClientSafeError('Food product not found.');
    return toFoodProduct(updated);
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
        carbsHundredths: scale(product.carbsPer100gHundredths),
        consumedAt: new Date(),
        fatHundredths: scale(product.fatPer100gHundredths),
        gramsHundredths,
        kcalHundredths: scale(product.kcalPer100gHundredths) ?? 0,
        kind: 'product',
        logDate: data.date,
        name: product.name,
        productId: product.id,
        proteinHundredths: scale(product.proteinPer100gHundredths),
        userId: session.user.id,
      })
      .returning();
    if (!inserted) throw new Error('Food log could not be created.');
    return toCalorieLog(inserted);
  });

export const recordCustomCalories = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('recordCustomCalories')])
  .validator(arkTypeValidator(recordCustomCaloriesInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const [inserted] = await db
      .insert(foodLogs)
      .values({
        carbsHundredths: optionalHundredths(data.carbs),
        consumedAt: new Date(),
        fatHundredths: optionalHundredths(data.fat),
        gramsHundredths: optionalHundredths(data.grams),
        kcalHundredths: toHundredths(data.kcal),
        kind: 'custom',
        logDate: data.date,
        name: data.name.trim(),
        productId: null,
        proteinHundredths: optionalHundredths(data.protein),
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
      existing.kind === 'product' && existing.gramsHundredths && nextGrams !== null
        ? nextGrams / existing.gramsHundredths
        : null;
    const [updated] = await db
      .update(foodLogs)
      .set({
        carbsHundredths:
          ratio === null
            ? optionalHundredths(data.carbs)
            : existing.carbsHundredths === null
              ? null
              : Math.round(existing.carbsHundredths * ratio),
        fatHundredths:
          ratio === null
            ? optionalHundredths(data.fat)
            : existing.fatHundredths === null
              ? null
              : Math.round(existing.fatHundredths * ratio),
        gramsHundredths: nextGrams,
        kcalHundredths:
          ratio === null ? toHundredths(data.kcal) : Math.round(existing.kcalHundredths * ratio),
        logDate: data.date,
        name: existing.kind === 'product' ? existing.name : data.name.trim(),
        proteinHundredths:
          ratio === null
            ? optionalHundredths(data.protein)
            : existing.proteinHundredths === null
              ? null
              : Math.round(existing.proteinHundredths * ratio),
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

export const setDailyCalorieGoal = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setDailyCalorieGoal')])
  .validator(arkTypeValidator(setDailyCalorieGoalInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const values = {
      carbsLimitHundredths: optionalHundredths(data.carbs),
      fatLimitHundredths: optionalHundredths(data.fat),
      kcalLimitHundredths: toHundredths(data.kcal),
      proteinLimitHundredths: optionalHundredths(data.protein),
    };
    const [goal] = await db
      .insert(calorieGoals)
      .values({ ...values, effectiveDate: data.date, userId: session.user.id })
      .onConflictDoUpdate({
        set: { ...values, updatedAt: new Date() },
        target: [calorieGoals.userId, calorieGoals.effectiveDate],
      })
      .returning();
    if (!goal) throw new Error('Daily calorie goal could not be saved.');
    return toCalorieGoal(goal);
  });
