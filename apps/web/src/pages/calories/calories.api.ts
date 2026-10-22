import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createMiddleware, createServerFn } from '@tanstack/react-start';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { dateOnlyType } from '@/lib/dateOnly';
import { calorieDayNotes, calorieGoals, foodLogs, foodProducts } from '@veles/db/schema';
import { foodProductCategory, type FoodProductCategory } from '@veles/db/seed/food-products';
import { requireSession } from '@/server/getSession.server';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/server/db.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { fromHundredths, HUNDREDTHS, toCalorieGoal } from '@/lib/nutrition';
import { calorieWeekDates, isWithinKcalGoal } from './calorieHelpers';
import {
  barcodeInputType,
  createFoodProductValuesType,
  foodLogIdsInputType,
  foodLogsDateInputType,
  multiplyFoodLogsInputType,
  recordCustomCaloriesValuesType,
  recordFoodValuesType,
  updateFoodLogValuesType,
  updateFoodProductValuesType,
} from './calories.validation';
import { getFoodImageAssets } from './foodImages.server';
import {
  copyFoodLogsRecord,
  deleteFoodLogsRecord,
  moveFoodLogsRecord,
  multiplyFoodLogsRecord,
  recordCustomCaloriesRecord,
  recordFoodRecord,
  toCalorieLog,
  updateFoodLogRecord,
} from './foodLogs.server';
import {
  createFoodProductRecord,
  lookupFoodByBarcodeRecord,
  toFoodProduct,
  updateFoodProductRecord,
} from './foodProducts.server';
import { translate } from '@/lib/i18n/getLocale';

const FOOD_UPLOAD_MAX_REQUEST_BYTES = 12 * 1024 * 1024;

const nonEmptyPhotoType = type('File').narrow((photo, ctx) =>
  photo.size > 0 ? true : ctx.mustBe('a non-empty file'),
);
const foodLogIdInputType = type({ id: 'string.uuid' });

const limitFoodUploadRequestMiddleware = createMiddleware().server(async ({ next, request }) => {
  const contentLength = type('string.numeric.parse |> number.integer >= 0')(
    request.headers.get('content-length') ?? '',
  );
  if (contentLength instanceof type.errors || contentLength > FOOD_UPLOAD_MAX_REQUEST_BYTES) {
    throw new ClientSafeError(
      translate({ en: 'Upload request is too large.', pl: 'Przesyłane dane są za duże.' }),
    );
  }
  return next();
});

type LogProduct = { imageUploadObjectId: string | null; seedKey: string | null };

/** Loads the image and seed key of the products behind logs, so logs can fall back to them. */
async function getLogProducts(productIds: Array<string | null>) {
  const ids = [...new Set(productIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Map<string, LogProduct>();

  const products = await db
    .select({
      id: foodProducts.id,
      imageUploadObjectId: foodProducts.imageUploadObjectId,
      seedKey: foodProducts.seedKey,
    })
    .from(foodProducts)
    .where(inArray(foodProducts.id, ids));
  return new Map(products.map(({ id, ...product }) => [id, product]));
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

const dashboardInputType = type({ date: dateOnlyType });

export const getCalorieDashboard = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getCalorieDashboard')])
  .validator(arkTypeValidator(dashboardInputType))
  .handler(async ({ data }): Promise<CalorieDashboard> => {
    const session = await requireSession();
    const weekDates = calorieWeekDates(data.date);
    const [weekStart, weekEnd] = [weekDates[0], weekDates.at(-1)];

    if (!weekStart || !weekEnd) throw new Error('A calorie week must contain at least one day.');

    const [goals, logs, dayNotes] = await Promise.all([
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
      db
        .select()
        .from(calorieDayNotes)
        .where(
          and(
            eq(calorieDayNotes.userId, session.user.id),
            gte(calorieDayNotes.date, weekStart),
            lte(calorieDayNotes.date, weekEnd),
          ),
        ),
    ]);
    const logProducts = await getLogProducts(logs.map((entry) => entry.productId));
    const assetsById = await getFoodImageAssets([
      ...logs.map((entry) => entry.imageUploadObjectId),
      ...[...logProducts.values()].map((product) => product.imageUploadObjectId),
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
      const dayNote = dayNotes.find((entry) => entry.date === date);
      const kcalHundredths = dayLogs.reduce(
        (total, logEntry) => total + logEntry.kcalHundredths,
        0,
      );

      return {
        date,
        goal: goal ? toCalorieGoal(goal) : null,
        logs: dayLogs.map((entry) => {
          const product = entry.productId ? logProducts.get(entry.productId) : undefined;
          return toCalorieLog(
            entry,
            assetsById.get(entry.imageUploadObjectId ?? ''),
            assetsById.get(product?.imageUploadObjectId ?? ''),
            foodProductCategory(product?.seedKey ?? null),
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
        offPlan: dayNote?.offPlan ?? false,
        note: dayNote?.note ?? null,
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
  offPlan: boolean;
  note: string | null;
};

export type CalorieFood = {
  id: string;
  name: string;
  namePl: string | null;
  barcode: string | null;
  imageUrl: string | null;
  category: FoodProductCategory | null;
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
  category: FoodProductCategory | null;
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
    if (!food)
      throw new ClientSafeError(
        translate({ en: 'Food product not found.', pl: 'Nie znaleziono produktu.' }),
      );

    const assetsById = await getFoodImageAssets([food.imageUploadObjectId]);
    return toFoodProduct(food, assetsById.get(food.imageUploadObjectId ?? ''));
  });

export const lookupFoodByBarcode = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('lookupFoodByBarcode')])
  .validator(arkTypeValidator(barcodeInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return lookupFoodByBarcodeRecord(session.user.id, data);
  });

const createFoodProductMultipartType = type('FormData.parse').to({
  values: type('string.json.parse').to(createFoodProductValuesType),
  'photo?': nonEmptyPhotoType,
});

export const createFoodProduct = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createFoodProduct'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(createFoodProductMultipartType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return createFoodProductRecord(session.user.id, data.values, data.photo ?? null);
  });

const updateFoodProductMultipartType = type('FormData.parse').to({
  values: type('string.json.parse').to(updateFoodProductValuesType),
  'photo?': nonEmptyPhotoType,
});

export const updateFoodProduct = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateFoodProduct'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(updateFoodProductMultipartType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return updateFoodProductRecord(session.user.id, data.values, data.photo ?? null);
  });

const recordFoodMultipartType = type('FormData.parse').to({
  values: type('string.json.parse').to(recordFoodValuesType),
  'photo?': nonEmptyPhotoType,
});

export const recordFood = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('recordFood'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(recordFoodMultipartType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    if (data.photo)
      throw new ClientSafeError(
        translate({
          en: 'Product-backed entries use the product photo.',
          pl: 'Wpisy powiązane z produktem używają zdjęcia produktu.',
        }),
      );
    return recordFoodRecord(session.user.id, data.values);
  });

const recordCustomCaloriesMultipartType = type('FormData.parse').to({
  values: type('string.json.parse').to(recordCustomCaloriesValuesType),
  'photo?': nonEmptyPhotoType,
});

export const recordCustomCalories = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('recordCustomCalories'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(recordCustomCaloriesMultipartType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return recordCustomCaloriesRecord(session.user.id, data.values, data.photo ?? null);
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
    if (!entry)
      throw new ClientSafeError(
        translate({ en: 'Food log not found.', pl: 'Nie znaleziono wpisu.' }),
      );

    const logProducts = await getLogProducts([entry.productId]);
    const product = entry.productId ? logProducts.get(entry.productId) : undefined;
    const assetsById = await getFoodImageAssets([
      entry.imageUploadObjectId,
      product?.imageUploadObjectId,
    ]);
    return toCalorieLog(
      entry,
      assetsById.get(entry.imageUploadObjectId ?? ''),
      assetsById.get(product?.imageUploadObjectId ?? ''),
      foodProductCategory(product?.seedKey ?? null),
    );
  });

const updateFoodLogMultipartType = type('FormData.parse').to({
  values: type('string.json.parse').to(updateFoodLogValuesType),
  'photo?': nonEmptyPhotoType,
});

export const updateFoodLog = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateFoodLog'), limitFoodUploadRequestMiddleware])
  .validator(arkTypeValidator(updateFoodLogMultipartType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return updateFoodLogRecord(session.user.id, data.values, data.photo ?? null);
  });

export const deleteFoodLog = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteFoodLog')])
  .validator(arkTypeValidator(foodLogIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await deleteFoodLogsRecord(session.user.id, { ids: [data.id] });
  });

export const deleteFoodLogs = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteFoodLogs')])
  .validator(arkTypeValidator(foodLogIdsInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await deleteFoodLogsRecord(session.user.id, data);
  });

export const moveFoodLogs = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('moveFoodLogs')])
  .validator(arkTypeValidator(foodLogsDateInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await moveFoodLogsRecord(session.user.id, data);
  });

export const copyFoodLogs = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('copyFoodLogs')])
  .validator(arkTypeValidator(foodLogsDateInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await copyFoodLogsRecord(session.user.id, data);
  });

export const multiplyFoodLogs = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('multiplyFoodLogs')])
  .validator(arkTypeValidator(multiplyFoodLogsInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await multiplyFoodLogsRecord(session.user.id, data);
  });
