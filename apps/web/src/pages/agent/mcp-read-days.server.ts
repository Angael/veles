import { calorieGoals } from '@veles/db/schema';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { and, desc, eq, lte } from 'drizzle-orm';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { readAgentPermissions } from '@/server/agentAccess.server';
import { db } from '@/server/db.server';
import { type ReadPage, toNutrition } from './mcp-read-helpers.server';
import { readFoodDays } from './mcp-read-nutrition.server';
import { readWeights } from './mcp-read-personal.server';
import { readWorkoutSessions } from './mcp-read-workouts.server';

export const MAX_DAYS = 31;
export const dayFeatures = ['calories', 'calorie_goals', 'weight', 'workouts'] as const;

type Nutrition = ReturnType<typeof toNutrition>;
type FoodDay = {
  date: string;
  offPlan: boolean;
  note: string | null;
  total: Nutrition;
  entries: unknown[];
};

/** Logged and not a cheat day: the total is the real intake, so it can count in averages. */
const isCompleteDay = (day: FoodDay) => day.entries.length > 0 && !day.offPlan;
type Weight = { date: string; weightKg: number };
type Session = { date: string };

const round = (value: number) => Math.round(value * 100) / 100;
const minus = (limit: number | null, used: number | null) =>
  limit === null || used === null ? null : round(limit - used);

/** Reads every row of a dated range; days are capped, so a leftover page means a bug, not data. */
async function readAll<T>(
  read: (userId: string, query: { limit: number; from: string; to: string }) => Promise<ReadPage>,
  userId: string,
  from: string,
  to: string,
) {
  const page = await read(userId, { limit: 10_000, from, to });
  if (page.nextCursor) throw new ClientSafeError('Too many records; use a shorter range.');
  return page.items as T[];
}

function datesBetween(from: string, to: string) {
  const start = parseISO(from);
  const count = differenceInCalendarDays(parseISO(to), start) + 1;
  if (count < 1) throw new ClientSafeError('from must be on or before to.');
  if (count > MAX_DAYS) throw new ClientSafeError(`Pick at most ${MAX_DAYS} days.`);
  return Array.from({ length: count }, (_, index) => format(addDays(start, index), 'yyyy-MM-dd'));
}

/**
 * Daily snapshots for a date range in one call: food, the goal in effect with what remains,
 * weight, and workouts per day, plus period totals. Lets an agent review a day or a week
 * without joining several resources. Each section follows its own live read consent; sections
 * without consent are omitted and listed in `notPermitted`, never filled with empty values.
 */
export async function readDays(userId: string, from: string, to: string) {
  const dates = datesBetween(from, to);
  const can = await readAgentPermissions(userId);
  if (!dayFeatures.some((feature) => can[feature].read)) {
    throw new ClientSafeError('Agent access is not allowed.');
  }
  const [food, goals, weights, sessions] = await Promise.all([
    can.calories.read ? readAll<FoodDay>(readFoodDays, userId, from, to) : null,
    can.calorie_goals.read
      ? db
          .select()
          .from(calorieGoals)
          .where(and(eq(calorieGoals.userId, userId), lte(calorieGoals.effectiveDate, to)))
          .orderBy(desc(calorieGoals.effectiveDate))
      : null,
    can.weight.read ? readAll<Weight>(readWeights, userId, from, to) : null,
    can.workouts.read ? readAll<Session>(readWorkoutSessions, userId, from, to) : null,
  ]);
  const foodByDate = new Map(food?.map((day) => [day.date, day]));
  const weightByDate = new Map(weights?.map((entry) => [entry.date, entry]));
  const sessionsByDate = Map.groupBy(sessions ?? [], (session) => session.date);

  const days = dates.map((date) => {
    const logged = foodByDate.get(date);
    const goalRow = goals?.find((candidate) => candidate.effectiveDate <= date);
    const goal = goalRow
      ? {
          effectiveDate: goalRow.effectiveDate,
          ...toNutrition({
            kcal: goalRow.kcalLimitHundredths,
            protein: goalRow.proteinLimitHundredths,
            fat: goalRow.fatLimitHundredths,
            carbs: goalRow.carbsLimitHundredths,
          }),
        }
      : null;
    return {
      date,
      ...(food && {
        food: logged
          ? {
              offPlan: logged.offPlan,
              note: logged.note,
              total: logged.total,
              entries: logged.entries,
            }
          : null,
      }),
      ...(goals && { goal }),
      // Remaining needs the goal and the real intake; unlogged and cheat days have neither.
      ...(food &&
        goals && {
          remaining:
            goal && logged && isCompleteDay(logged)
              ? {
                  kcal: minus(goal.kcal, logged.total.kcal),
                  macros: {
                    protein: minus(goal.macros.protein, logged.total.macros.protein),
                    fat: minus(goal.macros.fat, logged.total.macros.fat),
                    carbs: minus(goal.macros.carbs, logged.total.macros.carbs),
                  },
                }
              : null,
        }),
      ...(weights && { weight: weightByDate.get(date) ?? null }),
      ...(sessions && { workouts: sessionsByDate.get(date) ?? [] }),
    };
  });

  return {
    from,
    to,
    notPermitted: dayFeatures.filter((feature) => !can[feature].read),
    period: summarize(dates.length, food, weights, sessions),
    days,
  };
}

/**
 * Period view for weekly reviews: averages over logged days that are not cheat days, so gaps and
 * incomplete totals do not read as eating less.
 */
function summarize(
  dayCount: number,
  food: FoodDay[] | null,
  weights: Weight[] | null,
  sessions: Session[] | null,
) {
  const completeDays = (food ?? []).filter(isCompleteDay);
  const average = (pick: (total: Nutrition) => number | null) => {
    const values = completeDays.map((day) => pick(day.total)).filter((value) => value !== null);
    return values.length
      ? round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : null;
  };
  // Readers return newest first.
  const firstWeight = weights?.at(-1);
  const lastWeight = weights?.[0];
  return {
    dayCount,
    ...(food && {
      foodLoggedDays: food.filter((day) => day.entries.length > 0).length,
      cheatDays: food.filter((day) => day.offPlan).length,
      averagePerLoggedDay: completeDays.length
        ? {
            kcal: average((total) => total.kcal),
            macros: {
              protein: average((total) => total.macros.protein),
              fat: average((total) => total.macros.fat),
              carbs: average((total) => total.macros.carbs),
            },
          }
        : null,
    }),
    ...(weights && {
      weighIns: weights.length,
      weightChangeKg:
        firstWeight && lastWeight && weights.length > 1
          ? round(lastWeight.weightKg - firstWeight.weightKg)
          : null,
    }),
    ...(sessions && { workoutCount: sessions.length }),
  };
}
