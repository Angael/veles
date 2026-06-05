import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
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
