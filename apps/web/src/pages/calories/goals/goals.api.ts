import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { desc, eq } from 'drizzle-orm';
import { weightEntries } from '@veles/db/schema';
import { requireSession } from '@/server/getSession.server';
import { db } from '@/server/db.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { setDailyCalorieGoalRecord } from './goals.server';
import { setDailyCalorieGoalInputType } from './goals.validation';

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
    return setDailyCalorieGoalRecord(session.user.id, data);
  });
