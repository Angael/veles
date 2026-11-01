import { type } from 'arktype';
import { dateOnlyType } from '@/lib/dateOnly';

/** Upper bound for planned portions; plenty for batch cooking and keeps hundredths small. */
export const MAX_PLANNED_PORTIONS = 50;

const portionsType = type(`0 < number <= ${MAX_PLANNED_PORTIONS}`);

export const mealPlanWeekInputType = type({ weekStart: dateOnlyType });

/** A planned meal references one of the user's recipes, or is a free-text name. */
export const saveMealPlanItemInputType = type({
  'id?': 'string.uuid',
  date: dateOnlyType,
  recipeId: 'string.uuid | null',
  name: type('string.trim').pipe((value) => value.slice(0, 200)),
  portions: portionsType,
});

export const deleteMealPlanItemInputType = type({ id: 'string.uuid' });
