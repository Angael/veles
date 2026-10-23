import type { FoodProductCategory } from '@veles/db/seed/food-products';
export type Nutrition = {
  kcal: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

/** A recipe ingredient for the whole recipe; `per100g` is set only while it links a product. */
export type RecipeIngredient = {
  id: string;
  name: string;
  productId: string | null;
  grams: number | null;
  imageUrl: string | null;
  category: FoodProductCategory | null;
  per100g: Nutrition | null;
};

type NutritionSource = Pick<RecipeIngredient, 'grams' | 'per100g' | 'productId'>;

/** Only linked ingredients with an amount have nutrition, so only they can be logged. */
export function isLoggableIngredient<T extends NutritionSource>(
  ingredient: T,
): ingredient is T & { grams: number; per100g: Nutrition; productId: string } {
  return ingredient.per100g !== null && ingredient.productId !== null && ingredient.grams !== null;
}

/** Nutrition of one ingredient at `scale` × its recipe amount, or null when it is not loggable. */
export function ingredientNutrition(ingredient: NutritionSource, scale = 1): Nutrition | null {
  if (!isLoggableIngredient(ingredient)) return null;
  const factor = (ingredient.grams * scale) / 100;
  const at = (value: number | null) => (value === null ? null : value * factor);
  const { per100g } = ingredient;
  return {
    kcal: per100g.kcal * factor,
    protein: at(per100g.protein),
    fat: at(per100g.fat),
    carbs: at(per100g.carbs),
  };
}

export function sumNullable(left: number | null, right: number | null) {
  return left === null && right === null ? null : (left ?? 0) + (right ?? 0);
}

/**
 * Sums the nutrition of the loggable ingredients at `scale`. Null when none is loggable, so a
 * recipe of custom lines shows no kcal instead of 0. A macro no product tracks stays null.
 */
export function sumIngredientNutrition(
  ingredients: RecipeIngredient[],
  scale = 1,
): Nutrition | null {
  let total: Nutrition | null = null;
  for (const ingredient of ingredients) {
    const nutrition = ingredientNutrition(ingredient, scale);
    if (!nutrition) continue;
    total = total
      ? {
          kcal: total.kcal + nutrition.kcal,
          protein: sumNullable(total.protein, nutrition.protein),
          fat: sumNullable(total.fat, nutrition.fat),
          carbs: sumNullable(total.carbs, nutrition.carbs),
        }
      : nutrition;
  }
  return total;
}
