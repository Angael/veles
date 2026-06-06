import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from '@/lib/auth/auth';
import { logMiddleware } from '@/lib/middleware/logMiddleware';
import { getMockRecipeById, getMockRecipes } from './recipes.data';

const nullableNumberInputType = type('number | null');

const recipesInputType = type({
  search: 'string',
  nutritionField: '"kcal" | "protein" | "carbs" | "fats" | "none"',
  nutritionDirection: '"gte" | "lte"',
  nutritionValue: nullableNumberInputType,
  ratingDirection: '"gte" | "lte"',
  ratingValue: nullableNumberInputType,
});

export const getRecipes = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipes')])
  .inputValidator(arkTypeValidator(recipesInputType))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    return getMockRecipes(data, session?.user.id ?? null);
  });

const recipeByIdInputType = type({ id: 'string' });

export const getRecipeById = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRecipeById')])
  .inputValidator(arkTypeValidator(recipeByIdInputType))
  .handler(async ({ data }) => {
    return getMockRecipeById(data.id);
  });
