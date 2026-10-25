import type { calorieGoals, foodProducts } from '@veles/db/schema';
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

export function optionalHundredths(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : toHundredths(value);
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

/** Rounds to a whole number; decimals of kcal, macros, and food grams are insignificant. */
export function wholeOrNull(value: number | null | undefined): number | null {
  return value === null || value === undefined ? null : Math.round(value);
}

/** kcal and macros in kcal and grams; a null macro is not tracked. */
export type Nutrition = {
  kcal: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

/**
 * Nutrition of `grams` of a food from its values per 100 g. The one scaling rule for previews
 * and logged snapshots, so the kcal shown before saving matches the kcal that gets logged.
 */
export function nutritionForGrams(per100g: Nutrition, grams: number): Nutrition {
  const factor = grams / 100;
  const at = (value: number | null) => (value === null ? null : value * factor);
  return {
    kcal: per100g.kcal * factor,
    protein: at(per100g.protein),
    fat: at(per100g.fat),
    carbs: at(per100g.carbs),
  };
}

/** A catalog product's stored hundredths as nutrition per 100 g. */
export function productPer100g(product: typeof foodProducts.$inferSelect): Nutrition {
  return {
    kcal: product.kcalPer100gHundredths / HUNDREDTHS,
    protein: fromHundredths(product.proteinPer100gHundredths),
    fat: fromHundredths(product.fatPer100gHundredths),
    carbs: fromHundredths(product.carbsPer100gHundredths),
  };
}
