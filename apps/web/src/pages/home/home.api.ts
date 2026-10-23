import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, lte } from 'drizzle-orm';
import {
  calorieGoals,
  diaryEntries,
  foodLogs,
  recipes,
  weightEntries,
  workoutSessions,
} from '@veles/db/schema';
import { addDays, format, parseISO } from 'date-fns';
import { dateOnlyType } from '@/lib/dateOnly';
import { fromHundredths, HUNDREDTHS, toCalorieGoal } from '@/lib/nutrition';
import { requireSession } from '@/server/getSession.server';
import { db } from '@/server/db.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { getMealPlanItems } from '@/pages/meal-plan/mealPlan.server';
import type { MealPlanItem } from '@/pages/meal-plan/mealPlanEstimate';

/** Days the dashboard previews: today and the next two. */
const UPCOMING_PLAN_DAYS = 3;

export type HomeDashboardData = {
  date: string;
  mealPlan: Array<{ date: string; items: MealPlanItem[] }>;
  recipes: Array<{
    id: string;
    name: string;
    kcal: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  }>;
  nutrition: {
    goal: {
      kcal: number;
      protein: number | null;
      fat: number | null;
      carbs: number | null;
    } | null;
    totals: {
      kcal: number;
      protein: number;
      fat: number;
      carbs: number;
    };
  };
  lastDiaryEntryDate: string | null;
  lastWorkout: { name: string; date: string } | null;
  weightEntries: Array<{
    date: string;
    weightKg: number;
  }>;
};

const homeDashboardInputType = type({ date: dateOnlyType });

/** Loads the records needed to render today's authenticated home dashboard. */
export const getHomeDashboard = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getHomeDashboard')])
  .validator(arkTypeValidator(homeDashboardInputType))
  .handler(async ({ data }): Promise<HomeDashboardData> => {
    const session = await requireSession();
    const planDates = Array.from({ length: UPCOMING_PLAN_DAYS }, (_, index) =>
      format(addDays(parseISO(data.date), index), 'yyyy-MM-dd'),
    );
    const [mealPlanItems, recipeRows, weightRows, diaryRows, foodLogRows, goalRows, workoutRows] =
      await Promise.all([
        getMealPlanItems(session.user.id, data.date, planDates.at(-1) ?? data.date),
        db
          .select({
            kcal: recipes.kcal,
            protein: recipes.protein,
            fat: recipes.fats,
            carbs: recipes.carbs,
            id: recipes.id,
            name: recipes.name,
          })
          .from(recipes)
          .where(eq(recipes.userId, session.user.id)),
        db
          .select({ date: weightEntries.date, weightGrams: weightEntries.weightGrams })
          .from(weightEntries)
          .where(eq(weightEntries.userId, session.user.id))
          .orderBy(desc(weightEntries.date))
          .limit(8),
        db
          .select({ entryDate: diaryEntries.entryDate })
          .from(diaryEntries)
          .where(eq(diaryEntries.userId, session.user.id))
          .orderBy(desc(diaryEntries.entryDate), desc(diaryEntries.createdAt))
          .limit(1),
        db
          .select({
            kcal: foodLogs.kcalHundredths,
            protein: foodLogs.proteinHundredths,
            fat: foodLogs.fatHundredths,
            carbs: foodLogs.carbsHundredths,
          })
          .from(foodLogs)
          .where(and(eq(foodLogs.userId, session.user.id), eq(foodLogs.logDate, data.date))),
        db
          .select()
          .from(calorieGoals)
          .where(
            and(
              eq(calorieGoals.userId, session.user.id),
              lte(calorieGoals.effectiveDate, data.date),
            ),
          )
          .orderBy(desc(calorieGoals.effectiveDate))
          .limit(1),
        db
          .select({ name: workoutSessions.name, date: workoutSessions.date })
          .from(workoutSessions)
          .where(eq(workoutSessions.userId, session.user.id))
          .orderBy(desc(workoutSessions.date), desc(workoutSessions.createdAt))
          .limit(1),
      ]);
    const totals = foodLogRows.reduce<{
      kcal: number;
      protein: number;
      fat: number;
      carbs: number;
    }>(
      (result, log) => ({
        kcal: result.kcal + log.kcal,
        protein: result.protein + (log.protein ?? 0),
        fat: result.fat + (log.fat ?? 0),
        carbs: result.carbs + (log.carbs ?? 0),
      }),
      { kcal: 0, protein: 0, fat: 0, carbs: 0 },
    );
    const goal = goalRows[0] ? toCalorieGoal(goalRows[0]) : null;

    return {
      date: data.date,
      mealPlan: planDates.map((date) => ({
        date,
        items: mealPlanItems.filter((item) => item.date === date),
      })),
      recipes: recipeRows,
      nutrition: {
        goal: goal
          ? {
              kcal: goal.kcal,
              protein: goal.protein,
              fat: goal.fat,
              carbs: goal.carbs,
            }
          : null,
        totals: {
          kcal: totals.kcal / HUNDREDTHS,
          protein: fromHundredths(totals.protein) ?? 0,
          fat: fromHundredths(totals.fat) ?? 0,
          carbs: fromHundredths(totals.carbs) ?? 0,
        },
      },
      lastDiaryEntryDate: diaryRows[0]?.entryDate ?? null,
      lastWorkout: workoutRows[0] ?? null,
      weightEntries: weightRows
        .map((entry) => ({ date: entry.date, weightKg: entry.weightGrams / 1_000 }))
        .toReversed(),
    };
  });
