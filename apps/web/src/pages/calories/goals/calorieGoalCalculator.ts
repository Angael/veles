export type FormulaSex = 'female' | 'male';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very-active';
export type MacroPercentages = {
  protein: number;
  fat: number;
  carbs: number;
};
export type NutritionGoalValues = {
  kcal: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

export const DEFAULT_MACRO_PERCENTAGES: MacroPercentages = {
  protein: 25,
  fat: 30,
  carbs: 45,
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  'very-active': 1.725,
};

/** Estimates maintenance energy with Mifflin–St Jeor and a standard activity multiplier. */
export function estimateMaintenanceKcal(input: {
  age: number;
  sex: FormulaSex;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
}) {
  const sexConstant = input.sex === 'male' ? 5 : -161;
  const restingKcal = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + sexConstant;

  return Math.round(restingKcal * ACTIVITY_MULTIPLIERS[input.activity]);
}

/** Converts calorie percentages into gram targets using 4/9/4 kcal per gram. */
export function macrosFromPercentages(
  kcal: number,
  percentages: MacroPercentages,
): NutritionGoalValues {
  return {
    kcal,
    protein: roundToOneDecimal((kcal * percentages.protein) / 100 / 4),
    fat: roundToOneDecimal((kcal * percentages.fat) / 100 / 9),
    carbs: roundToOneDecimal((kcal * percentages.carbs) / 100 / 4),
  };
}

/** Derives each macro's calorie share so direct gram edits stay reflected in the percentage editor. */
export function percentagesFromMacros(
  values: NutritionGoalValues,
  fallback: MacroPercentages = DEFAULT_MACRO_PERCENTAGES,
): MacroPercentages {
  if (!values.kcal || values.kcal <= 0) return fallback;

  return {
    protein:
      values.protein === null
        ? fallback.protein
        : roundToOneDecimal((values.protein * 4 * 100) / values.kcal),
    fat:
      values.fat === null ? fallback.fat : roundToOneDecimal((values.fat * 9 * 100) / values.kcal),
    carbs:
      values.carbs === null
        ? fallback.carbs
        : roundToOneDecimal((values.carbs * 4 * 100) / values.kcal),
  };
}

export function macroPercentageTotal(percentages: MacroPercentages) {
  return percentages.protein + percentages.fat + percentages.carbs;
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}
