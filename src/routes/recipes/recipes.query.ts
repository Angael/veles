import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getMockRecipes, type RecipesQueryInput } from './MOCK_RECIPES';

export const DEFAULT_RECIPES_QUERY_INPUT: RecipesQueryInput = {
  search: '',
  nutritionField: 'none',
  nutritionDirection: 'lte',
  nutritionValue: null,
  ratingDirection: 'gte',
  ratingValue: null,
  userId: 'mock-user',
};

const recipesInputValidator = (data: RecipesQueryInput): RecipesQueryInput => ({
  search: typeof data.search === 'string' ? data.search : '',
  nutritionField:
    data.nutritionField === 'kcal' ||
    data.nutritionField === 'protein' ||
    data.nutritionField === 'carbs' ||
    data.nutritionField === 'fats'
      ? data.nutritionField
      : ('none' as const),
  nutritionDirection: data.nutritionDirection === 'gte' ? 'gte' : 'lte',
  nutritionValue: typeof data.nutritionValue === 'number' ? data.nutritionValue : null,
  ratingDirection: data.ratingDirection === 'lte' ? 'lte' : 'gte',
  ratingValue: typeof data.ratingValue === 'number' ? data.ratingValue : null,
  userId: typeof data.userId === 'string' ? data.userId : 'mock-user',
});

export const getRecipes = createServerFn({ method: 'GET' })
  .inputValidator(recipesInputValidator)
  .handler(async ({ data }) => {
    return getMockRecipes(data);
  });

export function recipesQueryOptions(input: RecipesQueryInput = DEFAULT_RECIPES_QUERY_INPUT) {
  return queryOptions({
    queryKey: ['recipes', input],
    queryFn: () => getRecipes({ data: input }),
  });
}
