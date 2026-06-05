import { type } from 'arktype';
import { createServerFn } from '@tanstack/react-start';
import { getMockRecipeById, getMockRecipes, type RecipesQueryInput } from './recipes.data';

const recipesInputType = type({
  search: 'string',
  nutritionField: '"kcal" | "protein" | "carbs" | "fats" | "none"',
  nutritionDirection: '"gte" | "lte"',
  nutritionValue: 'number | null',
  ratingDirection: '"gte" | "lte"',
  ratingValue: 'number | null',
  'userId?': 'string | null',
});

function recipesInputValidator(data: unknown): RecipesQueryInput {
  const result = recipesInputType(data);

  if (result instanceof type.errors) {
    throw new Error(result.summary);
  }

  return {
    ...result,
    userId: result.userId ?? 'mock-user',
  };
}

export const getRecipes = createServerFn({ method: 'GET' })
  .inputValidator(recipesInputValidator)
  .handler(async ({ data }) => {
    return getMockRecipes(data);
  });

const recipeByIdInputType = type({ id: 'string' });

function recipeByIdInputValidator(data: unknown) {
  const result = recipeByIdInputType(data);

  if (result instanceof type.errors) {
    throw new Error(result.summary);
  }

  return result;
}

export const getRecipeById = createServerFn({ method: 'GET' })
  .inputValidator(recipeByIdInputValidator)
  .handler(async ({ data }) => {
    return getMockRecipeById(data.id);
  });
