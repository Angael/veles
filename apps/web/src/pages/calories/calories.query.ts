import { queryOptions, useMutation } from '@tanstack/react-query';
import {
  createFoodProduct,
  deleteFoodLog,
  getCalorieDashboard,
  getFoodProduct,
  getFoodProducts,
  lookupFoodByBarcode,
  recordCustomCalories,
  recordFood,
  updateFoodLog,
  updateFoodProduct,
} from './calories.api';
import { setDailyCalorieGoal } from './goals/goals.api';
import { calorieWeekStart } from './calorieHelpers';

const calorieDashboardKey = ['calorie-dashboard'] as const;
const calorieFoodKey = ['calorie-food'] as const;
const calorieFoodsKey = ['calorie-foods'] as const;

type DeleteFoodLogVariables = {
  date: string;
  id: string;
};

type CalorieValues = {
  kcal: number;
  protein?: number;
  fat?: number;
  carbs?: number;
};

type RecordCustomCaloriesVariables = CalorieValues & {
  date: string;
  name: string;
};

type SetDailyCalorieGoalVariables = CalorieValues & {
  date: string;
};

type UpdateFoodLogVariables = CalorieValues & {
  date: string;
  grams?: number;
  id: string;
  name: string;
  previousDate: string;
};

type RecordFoodVariables = {
  date: string;
  grams: number;
  productId: string;
};

export function calorieDashboardQueryOptions(date: string) {
  const weekStart = calorieWeekStart(date);

  return queryOptions({
    queryKey: [...calorieDashboardKey, weekStart],
    queryFn: () => getCalorieDashboard({ data: { date: weekStart } }),
    staleTime: 30_000,
  });
}

export function calorieFoodQueryOptions(id: string) {
  return queryOptions({
    queryKey: [...calorieFoodKey, id],
    queryFn: () => getFoodProduct({ data: { id } }),
    staleTime: 30_000,
  });
}

export function calorieFoodsQueryOptions() {
  return queryOptions({
    queryKey: calorieFoodsKey,
    queryFn: () => getFoodProducts(),
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

export function useRecordFoodMutation() {
  return useMutation({
    mutationFn: (variables: RecordFoodVariables) => recordFood({ data: variables }),
    onSuccess: (_data, { date }, _onMutateResult, context) =>
      context.client.invalidateQueries({
        queryKey: calorieDashboardQueryOptions(date).queryKey,
      }),
  });
}

export function useCreateFoodProductMutation() {
  return useMutation({
    mutationFn: createFoodProduct,
    onSuccess: (_data, _variables, _onMutateResult, context) =>
      Promise.all([
        context.client.invalidateQueries({ queryKey: calorieFoodKey }),
        context.client.invalidateQueries({ queryKey: calorieFoodsKey }),
      ]),
  });
}

export function useLookupFoodByBarcodeMutation() {
  return useMutation({
    mutationFn: lookupFoodByBarcode,
    onSuccess: (_data, _variables, _onMutateResult, context) =>
      Promise.all([
        context.client.invalidateQueries({ queryKey: calorieFoodKey }),
        context.client.invalidateQueries({ queryKey: calorieFoodsKey }),
      ]),
  });
}

export function useRecordCustomCaloriesMutation() {
  return useMutation({
    mutationFn: (variables: RecordCustomCaloriesVariables) =>
      recordCustomCalories({ data: variables }),
    onSuccess: (_data, { date }, _onMutateResult, context) =>
      context.client.invalidateQueries({
        queryKey: calorieDashboardQueryOptions(date).queryKey,
      }),
  });
}

export function useSetDailyCalorieGoalMutation() {
  return useMutation({
    mutationFn: (variables: SetDailyCalorieGoalVariables) =>
      setDailyCalorieGoal({ data: variables }),
    onSuccess: (_data, _variables, _onMutateResult, context) =>
      context.client.invalidateQueries({ queryKey: calorieDashboardKey }),
  });
}

export function useUpdateFoodLogMutation() {
  return useMutation({
    mutationFn: ({ id, name, grams, kcal, protein, fat, carbs, date }: UpdateFoodLogVariables) =>
      updateFoodLog({
        data: { id, name, grams, kcal, protein, fat, carbs, date },
      }),
    onSuccess: (_data, { date, previousDate }, _onMutateResult, context) =>
      Promise.all([
        context.client.invalidateQueries({
          queryKey: calorieDashboardQueryOptions(previousDate).queryKey,
        }),
        context.client.invalidateQueries({
          queryKey: calorieDashboardQueryOptions(date).queryKey,
        }),
      ]),
  });
}

export function useUpdateFoodProductMutation() {
  return useMutation({
    mutationFn: updateFoodProduct,
    onSuccess: (_data, _variables, _onMutateResult, context) =>
      Promise.all([
        context.client.invalidateQueries({ queryKey: calorieFoodKey }),
        context.client.invalidateQueries({ queryKey: calorieFoodsKey }),
      ]),
  });
}
