import { format, isMatch, subDays } from 'date-fns';

export const CALORIE_DATE_FORMAT = 'yyyy-MM-dd';

export function todayLocalDate() {
  return format(new Date(), CALORIE_DATE_FORMAT);
}

export function normalizeCalorieDate(value: string | undefined) {
  return value && isMatch(value, CALORIE_DATE_FORMAT) ? value : todayLocalDate();
}

export function recentCalorieDates() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) =>
    format(subDays(today, index), CALORIE_DATE_FORMAT),
  );
}
