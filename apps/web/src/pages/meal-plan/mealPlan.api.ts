import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { addDays, format, parseISO } from 'date-fns';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import {
  deleteMealPlanItemRecord,
  getMealPlanItems,
  getPlannableRecipes,
  saveMealPlanItemRecord,
} from './mealPlan.server';
import {
  deleteMealPlanItemInputType,
  mealPlanWeekInputType,
  saveMealPlanItemInputType,
} from './mealPlan.validation';

export type MealPlanWeek = Awaited<ReturnType<typeof getMealPlanWeek>>;

/** Loads one week of planned meals plus the recipes the add/edit dialog can pick from. */
export const getMealPlanWeek = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getMealPlanWeek')])
  .validator(arkTypeValidator(mealPlanWeekInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const weekEnd = format(addDays(parseISO(data.weekStart), 6), 'yyyy-MM-dd');
    const [items, recipes] = await Promise.all([
      getMealPlanItems(session.user.id, data.weekStart, weekEnd),
      getPlannableRecipes(session.user.id),
    ]);
    return { weekStart: data.weekStart, items, recipes };
  });

export const saveMealPlanItem = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('saveMealPlanItem')])
  .validator(arkTypeValidator(saveMealPlanItemInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return saveMealPlanItemRecord(session.user.id, data);
  });

export const deleteMealPlanItem = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteMealPlanItem')])
  .validator(arkTypeValidator(deleteMealPlanItemInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return deleteMealPlanItemRecord(session.user.id, data.id);
  });
