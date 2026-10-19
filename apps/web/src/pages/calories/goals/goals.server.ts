import { calorieGoals } from '@veles/db/schema';
import { optionalHundredths, toCalorieGoal, toHundredths } from '@/lib/nutrition';
import { db } from '@/server/db.server';
import type { setDailyCalorieGoalInputType } from './goals.validation';

/** Upserts the goal that applies from `date` until the next goal's date. */
export async function setDailyCalorieGoalRecord(
  userId: string,
  data: typeof setDailyCalorieGoalInputType.infer,
) {
  const values = {
    kcalLimitHundredths: toHundredths(data.kcal),
    proteinLimitHundredths: optionalHundredths(data.protein),
    fatLimitHundredths: optionalHundredths(data.fat),
    carbsLimitHundredths: optionalHundredths(data.carbs),
  };

  const [goal] = await db
    .insert(calorieGoals)
    .values({ ...values, effectiveDate: data.date, userId })
    .onConflictDoUpdate({
      set: { ...values, updatedAt: new Date() },
      target: [calorieGoals.userId, calorieGoals.effectiveDate],
    })
    .returning();

  if (!goal) throw new Error('Daily calorie goal could not be saved.');

  return toCalorieGoal(goal);
}
