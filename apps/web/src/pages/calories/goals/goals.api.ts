import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { calorieGoals } from '@veles/db/schema';
import { requireSession } from '@/lib/auth/getSession';
import { dateOnlyType } from '@/lib/dateOnly';
import { db } from '@/lib/db';
import { logMiddleware } from '@/lib/middleware/logMiddleware';
import { optionalHundredths, toCalorieGoal, toHundredths } from '../calorieHelpers';

const setDailyCalorieGoalInputType = type({
  kcal: type('number > 0'),
  'protein?': type('number > 0'),
  'fat?': type('number > 0'),
  'carbs?': type('number > 0'),
  date: dateOnlyType,
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
