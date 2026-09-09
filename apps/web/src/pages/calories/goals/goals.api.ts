import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { calorieGoals, weightEntries } from '@veles/db/schema';
import { requireSession } from '@/server/getSession.server';
import { dateOnlyType } from '@/lib/dateOnly';
import { db } from '@/server/db.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { optionalHundredths, toCalorieGoal, toHundredths } from '@/lib/nutrition';

const optionalPositiveAmountType = type('number > 0 | undefined');

const setDailyCalorieGoalInputType = type({
  kcal: type('number > 0'),
  'protein?': optionalPositiveAmountType,
  'fat?': optionalPositiveAmountType,
  'carbs?': optionalPositiveAmountType,
  date: dateOnlyType,
});

export const getLatestWeightKg = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getLatestWeightKg')])
  .handler(async () => {
    const session = await requireSession();
    const [latestWeight] = await db
      .select({ weightGrams: weightEntries.weightGrams })
      .from(weightEntries)
      .where(eq(weightEntries.userId, session.user.id))
      .orderBy(desc(weightEntries.date))
      .limit(1);

    return latestWeight ? latestWeight.weightGrams / 1_000 : null;
  });

export const setDailyCalorieGoal = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setDailyCalorieGoal')])
  .validator(arkTypeValidator(setDailyCalorieGoalInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();

    const values = {
      kcalLimitHundredths: toHundredths(data.kcal),
      proteinLimitHundredths: optionalHundredths(data.protein),
      fatLimitHundredths: optionalHundredths(data.fat),
      carbsLimitHundredths: optionalHundredths(data.carbs),
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
