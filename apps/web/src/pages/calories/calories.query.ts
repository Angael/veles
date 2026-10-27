import { queryOptions, useMutation } from '@tanstack/react-query';
import { toastManager } from '@/components/ui/toast/toastManager';
import type { FoodProductUnit } from '@veles/db/seed/food-products';
import { todayLocalDate } from '@/lib/dateOnly';
import {
  copyFoodLogs,
  createFoodProduct,
  deleteFoodLog,
  deleteFoodLogs,
  getCalorieDashboard,
  getFoodProduct,
  getFoodProducts,
  lookupFoodByBarcode,
  moveFoodLogs,
  multiplyFoodLogs,
  recordCustomCalories,
  recordFood,
  updateFoodLog,
  updateFoodProduct,
} from './calories.api';
import { setDailyCalorieGoal } from './goals/goals.api';
import { calorieWeekStart, productCountText } from './calorieHelpers';
import { type I18n, useI18n } from '@/lib/i18n/I18nProvider';

export const calorieDashboardKey = ['calorie-dashboard'] as const;
const calorieFoodKey = ['calorie-food'] as const;
const calorieFoodsKey = ['calorie-foods'] as const;

type DeleteFoodLogVariables = {
  date: string;
  id: string;
};

export type ImageAction = 'keep' | 'replace' | 'remove';

export type ImageFields = {
  imageAction?: ImageAction;
  photo?: File;
};

type CalorieValues = {
  kcal: number;
  protein?: number;
  fat?: number;
  carbs?: number;
};

type RecordCustomCaloriesVariables = CalorieValues &
  ImageFields & {
    date: string;
    name: string;
  };

type SetDailyCalorieGoalVariables = CalorieValues & {
  date: string;
};

type UpdateFoodLogVariables = CalorieValues &
  ImageFields & {
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

type FoodProductVariables = ImageFields & {
  barcode?: string;
  name: string;
  productSizeGrams?: number;
  unit?: FoodProductUnit;
  kcalPer100g: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
};

type UpdateFoodProductVariables = FoodProductVariables & {
  id: string;
};

function toMultipartFormData<T extends object>(values: T & ImageFields) {
  const { photo, ...serializedValues } = values;
  const formData = new FormData();
  formData.set(
    'values',
    JSON.stringify({
      ...serializedValues,
      imageAction: serializedValues.imageAction ?? 'keep',
    }),
  );
  if (photo) formData.set('photo', photo, photo.name);
  return formData;
}
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
    meta: { invalidateQueryKey: calorieDashboardKey },
    mutationFn: ({ id }: DeleteFoodLogVariables) => deleteFoodLog({ data: { id } }),
  });
}

export function useDeleteFoodLogsMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({ en: 'Could not delete products', pl: 'Nie udało się usunąć produktów' }),
      },
      invalidateQueryKey: calorieDashboardKey,
    },
    mutationFn: (ids: string[]) => deleteFoodLogs({ data: { ids } }),
  });
}

export function useMultiplyFoodLogsMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: {
        title: t({ en: 'Could not multiply products', pl: 'Nie udało się pomnożyć produktów' }),
      },
      invalidateQueryKey: calorieDashboardKey,
    },
    mutationFn: (data: { factor: number; ids: string[] }) => multiplyFoodLogs({ data }),
  });
}

export type FoodLogsDateVariables = { date: string; ids: string[] };

/**
 * Success toast for move/copy. Lives on the mutation, not the `mutate()` call: moved rows and the
 * selection bar unmount once the dashboard refetches, which skips per-call callbacks.
 */
function toastFoodLogsDate(
  { formatDate, t }: I18n,
  action: 'copy' | 'move',
  { date, ids }: FoodLogsDateVariables,
) {
  const products = t(productCountText(ids.length));
  const day = formatDate(date, { day: 'numeric', month: 'short', weekday: 'short' });
  const enVerb = action === 'move' ? 'Moved' : 'Copied';
  const plVerb = action === 'move' ? 'Przeniesiono' : 'Skopiowano';
  toastManager.add({
    title: t({
      en: `${enVerb} ${products} to ${day}`,
      pl: `${plVerb} ${products} na ${day}`,
    }),
    type: 'success',
  });
}

export function useMoveFoodLogsMutation() {
  const i18n = useI18n();

  return useMutation({
    meta: {
      error: {
        title: i18n.t({ en: 'Could not move products', pl: 'Nie udało się przenieść produktów' }),
      },
      invalidateQueryKey: calorieDashboardKey,
    },
    mutationFn: (data: FoodLogsDateVariables) => moveFoodLogs({ data }),
    onSuccess: (_data, variables) => toastFoodLogsDate(i18n, 'move', variables),
  });
}

export function useCopyFoodLogsMutation() {
  const i18n = useI18n();

  return useMutation({
    meta: {
      error: {
        title: i18n.t({ en: 'Could not copy products', pl: 'Nie udało się skopiować produktów' }),
      },
      invalidateQueryKey: calorieDashboardKey,
    },
    mutationFn: (data: FoodLogsDateVariables) => copyFoodLogs({ data }),
    onSuccess: (_data, variables) => toastFoodLogsDate(i18n, 'copy', variables),
  });
}

export function useRecordFoodMutation() {
  return useMutation({
    meta: { invalidateQueryKey: calorieDashboardKey },
    mutationFn: (variables: RecordFoodVariables) =>
      recordFood({ data: toMultipartFormData({ ...variables }) }),
  });
}

export function useCreateFoodProductMutation() {
  return useMutation({
    mutationFn: (variables: FoodProductVariables) =>
      createFoodProduct({ data: toMultipartFormData(variables) }),
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
    meta: { invalidateQueryKey: calorieDashboardKey },
    mutationFn: (variables: RecordCustomCaloriesVariables) =>
      recordCustomCalories({ data: toMultipartFormData(variables) }),
  });
}

export function useSetDailyCalorieGoalMutation() {
  return useMutation({
    meta: { invalidateQueryKey: calorieDashboardKey },
    mutationFn: (variables: SetDailyCalorieGoalVariables) =>
      setDailyCalorieGoal({ data: variables }),
  });
}

export function useUpdateFoodLogMutation() {
  return useMutation({
    meta: { invalidateQueryKey: calorieDashboardKey },
    mutationFn: ({ previousDate: _previousDate, ...variables }: UpdateFoodLogVariables) =>
      updateFoodLog({ data: toMultipartFormData(variables) }),
  });
}

export function useUpdateFoodProductMutation() {
  return useMutation({
    meta: { invalidateQueryKey: calorieDashboardKey },
    mutationFn: (variables: UpdateFoodProductVariables) =>
      updateFoodProduct({ data: toMultipartFormData({ ...variables, today: todayLocalDate() }) }),
    onSuccess: (_data, _variables, _onMutateResult, context) =>
      Promise.all([
        context.client.invalidateQueries({ queryKey: calorieFoodKey }),
        context.client.invalidateQueries({ queryKey: calorieFoodsKey }),
      ]),
  });
}
