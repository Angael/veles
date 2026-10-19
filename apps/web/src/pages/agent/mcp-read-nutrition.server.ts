import { and, asc, desc, eq, inArray, lt, lte } from 'drizzle-orm';
import { calorieGoals, foodLogs, foodProducts, uploadObjects } from '@veles/db/schema';
import { fromHundredths } from '@/lib/nutrition';
import { readAgentPermissions } from '@/server/agentAccess.server';
import { db } from '@/server/db.server';
import { storagePathToUrl } from '@/server/storage/config.server';
import {
  byIdDesc,
  inDateRange,
  parseKey,
  type ReadQuery,
  toNutrition,
  toPage,
} from './mcp-read-helpers.server';

const goalNutrition = (goal: typeof calorieGoals.$inferSelect) =>
  toNutrition({
    kcal: goal.kcalLimitHundredths,
    protein: goal.proteinLimitHundredths,
    fat: goal.fatLimitHundredths,
    carbs: goal.carbsLimitHundredths,
  });

/**
 * One item per logged day, newest first: entries, day totals, and the goal in effect that day.
 * Agents get the same daily view as the app instead of summing logs and matching goal dates.
 */
export async function readFoodDays(userId: string, query: ReadQuery) {
  const days = await db
    .selectDistinct({ date: foodLogs.logDate })
    .from(foodLogs)
    .where(
      and(
        eq(foodLogs.userId, userId),
        query.id ? eq(foodLogs.logDate, parseKey(query.id, 'date')) : undefined,
        query.cursor ? lt(foodLogs.logDate, parseKey(query.cursor, 'date')) : undefined,
        inDateRange(foodLogs.logDate, query),
      ),
    )
    .orderBy(desc(foodLogs.logDate))
    .limit(query.limit + 1);
  const page = toPage(days, query.limit, (day) => day.date);
  const dates = page.items.map((day) => day.date);
  const newest = dates[0];
  if (!newest) return { items: [], nextCursor: null };

  // Goals are a separate consent; days still load without them.
  const canReadGoals = (await readAgentPermissions(userId)).calorie_goals.read;
  const [logs, goals] = await Promise.all([
    db
      .select({ log: foodLogs, imageKey: uploadObjects.key })
      .from(foodLogs)
      .leftJoin(uploadObjects, eq(uploadObjects.id, foodLogs.imageUploadObjectId))
      .where(and(eq(foodLogs.userId, userId), inArray(foodLogs.logDate, dates)))
      .orderBy(asc(foodLogs.consumedAt), asc(foodLogs.id)),
    canReadGoals
      ? db
          .select()
          .from(calorieGoals)
          .where(and(eq(calorieGoals.userId, userId), lte(calorieGoals.effectiveDate, newest)))
          .orderBy(desc(calorieGoals.effectiveDate))
      : [],
  ]);
  const logsByDate = Map.groupBy(logs, ({ log }) => log.logDate);

  return {
    nextCursor: page.nextCursor,
    items: dates.map((date) => {
      const dayLogs = logsByDate.get(date) ?? [];
      const sum = (pick: (log: (typeof logs)[number]['log']) => number | null) =>
        dayLogs.reduce((total, { log }) => total + (pick(log) ?? 0), 0);
      const goal = goals.find((candidate) => candidate.effectiveDate <= date);
      return {
        id: date,
        date,
        total: toNutrition({
          kcal: sum((log) => log.kcalHundredths),
          protein: sum((log) => log.proteinHundredths),
          fat: sum((log) => log.fatHundredths),
          carbs: sum((log) => log.carbsHundredths),
        }),
        goal: goal ? { effectiveDate: goal.effectiveDate, ...goalNutrition(goal) } : null,
        entries: dayLogs.map(({ log, imageKey }) => ({
          id: log.id,
          name: log.name,
          productId: log.productId,
          consumedAt: log.consumedAt,
          grams: fromHundredths(log.gramsHundredths),
          imageUrl: storagePathToUrl(imageKey),
          ...toNutrition({
            kcal: log.kcalHundredths,
            protein: log.proteinHundredths,
            fat: log.fatHundredths,
            carbs: log.carbsHundredths,
          }),
        })),
      };
    }),
  };
}

/** Owned goal history, newest effective date first. */
export async function readCalorieGoals(userId: string, query: ReadQuery) {
  const rows = await db
    .select()
    .from(calorieGoals)
    .where(
      and(
        eq(calorieGoals.userId, userId),
        query.id ? eq(calorieGoals.id, parseKey(query.id, 'uuid')) : undefined,
        query.cursor ? lt(calorieGoals.effectiveDate, parseKey(query.cursor, 'date')) : undefined,
        inDateRange(calorieGoals.effectiveDate, query),
      ),
    )
    .orderBy(desc(calorieGoals.effectiveDate))
    .limit(query.limit + 1);
  const page = toPage(rows, query.limit, (goal) => goal.effectiveDate);
  return {
    nextCursor: page.nextCursor,
    items: page.items.map((goal) => ({
      id: goal.id,
      effectiveDate: goal.effectiveDate,
      ...goalNutrition(goal),
    })),
  };
}

/** Shared catalog, newest first; not owner-scoped because every account reads the same rows. */
export async function readFoodProducts(_userId: string, query: ReadQuery) {
  const rows = await db
    .select({ product: foodProducts, imageKey: uploadObjects.key })
    .from(foodProducts)
    .leftJoin(uploadObjects, eq(uploadObjects.id, foodProducts.imageUploadObjectId))
    .where(byIdDesc(foodProducts.id, query))
    .orderBy(desc(foodProducts.id))
    .limit(query.limit + 1);
  const page = toPage(rows, query.limit, ({ product }) => product.id);
  return {
    nextCursor: page.nextCursor,
    items: page.items.map(({ product, imageKey }) => ({
      id: product.id,
      name: product.name,
      namePl: product.namePl,
      barcode: product.barcode,
      productSizeGrams: fromHundredths(product.productSizeGramsHundredths),
      imageUrl: storagePathToUrl(imageKey),
      per100g: toNutrition({
        kcal: product.kcalPer100gHundredths,
        protein: product.proteinPer100gHundredths,
        fat: product.fatPer100gHundredths,
        carbs: product.carbsPer100gHundredths,
      }),
    })),
  };
}
