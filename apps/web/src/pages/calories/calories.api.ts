import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
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
  isWithinKcalGoal,
  optionalHundredths,
  toCalorieGoal,
  toHundredths,
} from './calorieHelpers';
import { calorieWeekDates } from './calorieHelpers';

const MAX_TEXT_LENGTH = 500;

const nonNegativeAmountType = type('number >= 0').narrow((value, ctx) =>
  Number.isFinite(value) && Number.isSafeInteger(Math.round(value * HUNDREDTHS))
    ? true
    : ctx.mustBe('a finite number with at most two decimal places'),
);

const nonEmptyTextType = type(`string.trim |> 1 <= string <= ${MAX_TEXT_LENGTH}`);
const optionalNonEmptyTextType = nonEmptyTextType.or('undefined');
const optionalImageUrlType = type('string.url | undefined');
const optionalPositiveAmountType = type('number > 0 | undefined');
const optionalNonNegativeAmountType = nonNegativeAmountType.or('undefined');

const createFoodProductInputType = type({
  name: nonEmptyTextType,
  'brand?': optionalNonEmptyTextType,
  'barcode?': optionalNonEmptyTextType,
  'imageUrl?': optionalImageUrlType,
  'productSizeGrams?': optionalPositiveAmountType,
  kcalPer100g: nonNegativeAmountType,
  'proteinPer100g?': optionalNonNegativeAmountType,
  'fatPer100g?': optionalNonNegativeAmountType,
  'carbsPer100g?': optionalNonNegativeAmountType,
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

function toFoodProduct(product: typeof foodProducts.$inferSelect): CalorieFood {
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

function toCalorieLog(log: typeof foodLogs.$inferSelect): CalorieLog {
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

function calorieTotalsForLogs(logs: (typeof foodLogs.$inferSelect)[]): CalorieTotals {
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

/** Atomically imports a barcode or returns the product created by a concurrent lookup. */
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
  .handler(async ({ data }): Promise<CalorieDashboard> => {
    const session = await requireSession();
    const weekDates = calorieWeekDates(data.date);
    const [weekStart, weekEnd] = [weekDates[0], weekDates.at(-1)];

    if (!weekStart || !weekEnd) {
      throw new Error('A calorie week must contain at least one day.');
    }

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

    const logsByDate = new Map<string, (typeof foodLogs.$inferSelect)[]>();
    for (const log of logs) {
      const dayLogs = logsByDate.get(log.logDate);
      if (dayLogs) {
        dayLogs.push(log);
      } else {
        logsByDate.set(log.logDate, [log]);
      }
    }

    const days = weekDates.map((date): CalorieDashboardDay => {
      const dayLogs = logsByDate.get(date) ?? [];
      const goal = latestGoalForDate(goals, date);
      const kcalHundredths = dayLogs.reduce((total, log) => total + log.kcalHundredths, 0);

      return {
        date,
        goal: goal ? toCalorieGoal(goal) : null,
        logs: dayLogs.map(toCalorieLog),
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
  brand: string | null;
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

    try {
      const [product] = await db.insert(foodProducts).values(productValues(data)).returning();
      if (!product) throw new Error('A food product could not be created.');

      return toFoodProduct(product);
    } catch (error) {
      if (isBarcodeConflict(error)) {
        throw new ClientSafeError('A food product with this barcode already exists.');
      }
      throw error;
    }
  });

export const updateFoodProduct = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateFoodProduct')])
  .validator(arkTypeValidator(updateFoodProductInputType))
  .handler(async ({ data }) => {
    await requireSession();

    try {
      const [product] = await db
        .update(foodProducts)
        .set({ ...productValues(data), updatedAt: new Date() })
        .where(eq(foodProducts.id, data.id))
        .returning();

      if (!product) throw new ClientSafeError('Food product not found.');

      return toFoodProduct(product);
    } catch (error) {
      if (isBarcodeConflict(error)) {
        throw new ClientSafeError('A food product with this barcode already exists.');
      }
      throw error;
    }
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
  'grams?': optionalNonNegativeAmountType,
  kcal: nonNegativeAmountType,
  'protein?': optionalNonNegativeAmountType,
  'fat?': optionalNonNegativeAmountType,
  'carbs?': optionalNonNegativeAmountType,
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
  'grams?': optionalNonNegativeAmountType,
  kcal: nonNegativeAmountType,
  'protein?': optionalNonNegativeAmountType,
  'fat?': optionalNonNegativeAmountType,
  'carbs?': optionalNonNegativeAmountType,
  date: dateOnlyType,
});

function updateOptionalNutrient(
  inputValue: number | undefined,
  existingHundredths: number | null,
  ratio: number | null,
  isProduct: boolean,
) {
  if (!isProduct) return optionalHundredths(inputValue);
  return existingHundredths === null || ratio === null
    ? existingHundredths
    : Math.round(existingHundredths * ratio);
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
    const isProduct = existing.productId !== null;
    const ratio =
      isProduct && existing.gramsHundredths && nextGrams !== null
        ? nextGrams / existing.gramsHundredths
        : null;

    const [updated] = await db
      .update(foodLogs)
      .set({
        gramsHundredths: nextGrams,
        kcalHundredths: isProduct
          ? ratio === null
            ? existing.kcalHundredths
            : Math.round(existing.kcalHundredths * ratio)
          : toHundredths(data.kcal),
        proteinHundredths: updateOptionalNutrient(
          data.protein,
          existing.proteinHundredths,
          ratio,
          isProduct,
        ),
        fatHundredths: updateOptionalNutrient(data.fat, existing.fatHundredths, ratio, isProduct),
        carbsHundredths: updateOptionalNutrient(
          data.carbs,
          existing.carbsHundredths,
          ratio,
          isProduct,
        ),
        name: isProduct ? existing.name : data.name.trim(),
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
