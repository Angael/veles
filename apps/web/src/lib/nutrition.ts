import type { calorieGoals } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { translate } from '@/lib/i18n/getLocale';

export const HUNDREDTHS = 100;

export function toHundredths(value: number): number {
  const scaled = Math.round(value * HUNDREDTHS);

  if (!Number.isSafeInteger(scaled)) {
    throw new ClientSafeError(
      translate({
        en: 'Nutrition values are outside the supported range.',
        pl: 'Wartości odżywcze są poza obsługiwanym zakresem.',
      }),
    );
  }

  return scaled;
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
