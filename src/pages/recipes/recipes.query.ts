import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import type { RecipesQueryInput } from './recipes.data';
import { getRecipes } from './recipes.api';

export const DEFAULT_RECIPES_QUERY_INPUT: RecipesQueryInput = {
  search: '',
  nutritionField: 'none',
  nutritionDirection: 'lte',
  nutritionValue: null,
  ratingDirection: 'gte',
  ratingValue: null,
};

export function recipesQueryOptions(input: RecipesQueryInput = DEFAULT_RECIPES_QUERY_INPUT) {
  return queryOptions({
    queryKey: ['recipes', input],
    queryFn: () => getRecipes({ data: input }),
    placeholderData: keepPreviousData,
    // TODO: invalidate after adding recipe
    staleTime: 1000 * 60, // 1 min
  });
}
