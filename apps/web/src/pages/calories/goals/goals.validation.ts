import { type } from 'arktype';
import { dateOnlyType } from '@/lib/dateOnly';

const optionalPositiveAmountType = type('number > 0 | undefined');

export const setDailyCalorieGoalInputType = type({
  kcal: type('number > 0'),
  'protein?': optionalPositiveAmountType,
  'fat?': optionalPositiveAmountType,
  'carbs?': optionalPositiveAmountType,
  date: dateOnlyType,
});
