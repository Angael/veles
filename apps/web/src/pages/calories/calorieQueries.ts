import { queryOptions, type QueryClient, useMutation } from '@tanstack/react-query';
import { deleteFoodLog, getCalorieDashboard, getFoodProduct, searchFoods } from './calories.api';
import { calorieWeekStart } from './calorieHelpers';

const calorieDashboardKey = ['calorie-dashboard'] as const;
const calorieFoodKey = ['calorie-food'] as const;
const calorieFoodSearchKey = ['calorie-food-search'] as const;

type DeleteFoodLogVariables = {
  date: string;
  id: string;
};

export function calorieDashboardQueryOptions(date: string) {
  const weekStart = calorieWeekStart(date);

  return queryOptions({
    queryKey: [...calorieDashboardKey, weekStart],
    queryFn: () => getCalorieDashboard({ data: { date: weekStart } }),
    staleTime: 0,
  });
}

export function calorieFoodQueryOptions(id: string) {
  return queryOptions({
    queryKey: [...calorieFoodKey, id],
    queryFn: () => getFoodProduct({ data: { id } }),
    staleTime: 30_000,
  });
}

export function calorieFoodSearchQueryOptions(query: string) {
  const normalizedQuery = query.trim();

  return queryOptions({
    queryKey: [...calorieFoodSearchKey, normalizedQuery],
    queryFn: () => searchFoods({ data: { query: normalizedQuery } }),
    staleTime: 30_000,
  });
}

export function useDeleteFoodLogMutation() {
  return useMutation({
    mutationFn: ({ id }: DeleteFoodLogVariables) => deleteFoodLog({ data: { id } }),
    onSuccess: (_data, { date }, _onMutateResult, context) =>
      context.client.invalidateQueries({
        queryKey: calorieDashboardQueryOptions(date).queryKey,
      }),
  });
}

export function invalidateCalorieWeek(queryClient: QueryClient, date: string) {
  return queryClient.invalidateQueries({
    queryKey: calorieDashboardQueryOptions(date).queryKey,
  });
}

export function invalidateAllCalorieWeeks(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: calorieDashboardKey });
}

export function invalidateCalorieFoods(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: calorieFoodKey }),
    queryClient.invalidateQueries({ queryKey: calorieFoodSearchKey }),
  ]);
}
