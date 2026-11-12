/** Recipe fields a plan needs; nutrition is for the whole recipe, split across `portions`. */
export type PlannedRecipe = {
  id: string;
  name: string;
  portions: number;
  kcal: number | null;
  protein: number | null;
  fats: number | null;
  carbs: number | null;
};

export type MealPlanItem = {
  id: string;
  date: string;
  /** Saved free-text name; recipe meals show the recipe's current name instead. */
  name: string;
  portions: number;
  recipe: PlannedRecipe | null;
};

export type MealEstimate = {
  kcal: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

export type DayEstimate = {
  kcal: number;
  /** Meals counted in `kcal`. */
  estimatedCount: number;
  /** Meals without recipe nutrition; when above zero the total is a lower bound. */
  missingCount: number;
};

export function mealName(item: Pick<MealPlanItem, 'name' | 'recipe'>) {
  return item.recipe?.name ?? item.name;
}

/** Scales recipe nutrition to the planned portions; null when the meal has no known kcal. */
export function estimateMeal(item: Pick<MealPlanItem, 'portions' | 'recipe'>): MealEstimate | null {
  const recipe = item.recipe;
  if (!recipe || recipe.kcal === null) return null;
  const scale = item.portions / recipe.portions;
  const scaled = (value: number | null) => (value === null ? null : value * scale);

  return {
    kcal: recipe.kcal * scale,
    protein: scaled(recipe.protein),
    fat: scaled(recipe.fats),
    carbs: scaled(recipe.carbs),
  };
}

/** Sums the meals with known kcal and counts the rest, so an incomplete total is never shown as whole. */
export function estimateDay(items: Pick<MealPlanItem, 'portions' | 'recipe'>[]): DayEstimate {
  return items.reduce<DayEstimate>(
    (result, item) => {
      const estimate = estimateMeal(item);
      return estimate
        ? {
            ...result,
            kcal: result.kcal + estimate.kcal,
            estimatedCount: result.estimatedCount + 1,
          }
        : { ...result, missingCount: result.missingCount + 1 };
    },
    { kcal: 0, estimatedCount: 0, missingCount: 0 },
  );
}

/**
 * Quick add prefill for logging a planned meal: the user reviews and confirms it there, so a plan
 * only reaches the food log through an explicit save.
 */
export function mealQuickAddSearch(item: MealPlanItem) {
  const estimate = estimateMeal(item);
  const round = (value: number | null | undefined) =>
    value === null || value === undefined ? undefined : Math.round(value * 10) / 10;

  return {
    date: item.date,
    name: mealName(item),
    kcal: estimate ? Math.round(estimate.kcal) : undefined,
    protein: round(estimate?.protein),
    fat: round(estimate?.fat),
    carbs: round(estimate?.carbs),
  };
}
