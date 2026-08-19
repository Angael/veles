import { addDays, format, isMatch, parseISO, startOfWeek } from 'date-fns';

export const CALORIE_DATE_FORMAT = 'yyyy-MM-dd';

export function todayLocalDate() {
  return format(new Date(), CALORIE_DATE_FORMAT);
}

export function normalizeCalorieDate(value: string | undefined) {
  return value && isMatch(value, CALORIE_DATE_FORMAT) ? value : todayLocalDate();
}
export function calorieWeekStart(selectedDate: string) {
  return format(startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 }), CALORIE_DATE_FORMAT);
}

export function calorieWeekDates(selectedDate: string) {
  const monday = parseISO(calorieWeekStart(selectedDate));
  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(monday, index), CALORIE_DATE_FORMAT),
  );
}
