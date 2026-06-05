import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { getMockRecipeById, getMockRecipes, type RecipesQueryInput } from './recipes.data';

const nullableNumberInputType = type('string | number | null').pipe((value) => {
  if (value === null || typeof value === 'number') {
    return value;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return Number(trimmedValue);
}, type('number | null'));

const recipesInputType = type({
  search: 'string',
  nutritionField: '"kcal" | "protein" | "carbs" | "fats" | "none"',
  nutritionDirection: '"gte" | "lte"',
  nutritionValue: nullableNumberInputType,
  ratingDirection: '"gte" | "lte"',
  ratingValue: nullableNumberInputType,
  'userId?': 'string | null',
});

export const getRecipes = createServerFn({ method: 'GET' })
  .inputValidator(arkTypeValidator(recipesInputType))
  .handler(async ({ data }) => {
    return getMockRecipes({
      ...data,
      userId: data.userId ?? 'mock-user',
    } satisfies RecipesQueryInput);
  });

const recipeByIdInputType = type({ id: 'string' });

export const getRecipeById = createServerFn({ method: 'GET' })
  .inputValidator(arkTypeValidator(recipeByIdInputType))
  .handler(async ({ data }) => {
    return getMockRecipeById(data.id);
  });
