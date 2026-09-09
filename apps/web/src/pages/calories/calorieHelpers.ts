import { addDays, format, isMatch, parseISO, startOfWeek } from 'date-fns';
import type { calorieGoals } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';

export const HUNDREDTHS = 100;

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

export function toHundredths(value: number): number {
  const scaled = Math.round(value * HUNDREDTHS);

  if (!Number.isSafeInteger(scaled)) {
    throw new ClientSafeError('Nutrition values are outside the supported range.');
  }

  return scaled;
}

export function isWithinKcalGoal(kcalHundredths: number, goalKcalHundredths: number) {
  return Math.abs(kcalHundredths - goalKcalHundredths) * 10 <= goalKcalHundredths;
}

export function fromHundredths(value: number | null): number | null {
  return value === null ? null : value / HUNDREDTHS;
}

export function optionalHundredths(value: number | undefined): number | null {
  return value === undefined ? null : toHundredths(value);
}

export function toCalorieGoal(goal: typeof calorieGoals.$inferSelect) {
  return {
    id: goal.id,
    date: goal.effectiveDate,
    kcal: goal.kcalLimitHundredths / HUNDREDTHS,
    protein: fromHundredths(goal.proteinLimitHundredths),
    fat: fromHundredths(goal.fatLimitHundredths),
    carbs: fromHundredths(goal.carbsLimitHundredths),
  };
}
