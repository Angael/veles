import { calorieGoals } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';

export const HUNDREDTHS = 100;

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
