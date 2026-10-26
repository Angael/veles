import { and, asc, desc, eq, inArray, lt, lte } from 'drizzle-orm';
import {
  calorieDayNotes,
  calorieGoals,
  foodLogs,
  foodProducts,
  uploadObjects,
} from '@veles/db/schema';
import { fromHundredths } from '@/lib/nutrition';
import { readAgentPermissions } from '@/server/agentAccess.server';
import { db } from '@/server/db.server';
import { storagePathToUrl } from '@/server/storage/config.server';
import { listedFoodProduct } from '@/pages/calories/foodProducts.server';
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

/** Owned dates of one dated table, newest first, filtered like a food_days page. */
function pageDates(
  [userIdColumn, dateColumn]:
    | [typeof foodLogs.userId, typeof foodLogs.logDate]
    | [typeof calorieDayNotes.userId, typeof calorieDayNotes.date],
  userId: string,
  query: ReadQuery,
) {
  return db
    .selectDistinct({ date: dateColumn })
    .from(dateColumn.table)
    .where(
      and(
        eq(userIdColumn, userId),
        query.id ? eq(dateColumn, parseKey(query.id, 'date')) : undefined,
        query.cursor ? lt(dateColumn, parseKey(query.cursor, 'date')) : undefined,
        inDateRange(dateColumn, query),
      ),
    )
    .orderBy(desc(dateColumn))
    .limit(query.limit + 1);
}

/**
 * One item per day with food logs or a day note, newest first: entries, day totals, the off-plan
 * flag and note, and the goal in effect that day. Agents get the same daily view as the app
 * instead of summing logs and matching goal dates.
 */
export async function readFoodDays(userId: string, query: ReadQuery) {
  // The newest limit + 1 dates of the union are within the newest limit + 1 of each table.
  const [loggedDates, notedDates] = await Promise.all([
    pageDates([foodLogs.userId, foodLogs.logDate], userId, query),
    pageDates([calorieDayNotes.userId, calorieDayNotes.date], userId, query),
  ]);
  const days = [...new Set([...loggedDates, ...notedDates].map((day) => day.date))]
    .toSorted((a, b) => b.localeCompare(a))
    .slice(0, query.limit + 1)
    .map((date) => ({ date }));
  const page = toPage(days, query.limit, (day) => day.date);
  const dates = page.items.map((day) => day.date);
  const newest = dates[0];
  if (!newest) return { items: [], nextCursor: null };

  // Goals are a separate consent; days still load without them.
  const canReadGoals = (await readAgentPermissions(userId)).calorie_goals.read;
  const [logs, dayNotes, goals] = await Promise.all([
    db
      .select({ log: foodLogs, imageKey: uploadObjects.key })
      .from(foodLogs)
      .leftJoin(uploadObjects, eq(uploadObjects.id, foodLogs.imageUploadObjectId))
      .where(and(eq(foodLogs.userId, userId), inArray(foodLogs.logDate, dates)))
      .orderBy(asc(foodLogs.consumedAt), asc(foodLogs.id)),
    db
      .select()
      .from(calorieDayNotes)
      .where(and(eq(calorieDayNotes.userId, userId), inArray(calorieDayNotes.date, dates))),
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
      const dayNote = dayNotes.find((entry) => entry.date === date);
      return {
        id: date,
        date,
        offPlan: dayNote?.offPlan ?? false,
        note: dayNote?.note ?? null,
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
    .where(and(query.id ? undefined : listedFoodProduct, byIdDesc(foodProducts.id, query)))
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
