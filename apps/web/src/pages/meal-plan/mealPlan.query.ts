import { queryOptions, useMutation } from '@tanstack/react-query';
import { deleteMealPlanItem, getMealPlanWeek, saveMealPlanItem } from './mealPlan.api';
import { useI18n } from '@/lib/i18n/I18nProvider';

const mealPlanKey = ['meal-plan'] as const;

export type SaveMealPlanItemVariables = {
  id?: string;
  date: string;
  recipeId: string | null;
  name: string;
  portions: number;
};

export function mealPlanWeekQueryOptions(weekStart: string) {
  return queryOptions({
    queryKey: [...mealPlanKey, weekStart],
    queryFn: () => getMealPlanWeek({ data: { weekStart } }),
    staleTime: 30_000,
  });
}

/** Saves a planned meal; every cached week refetches because a date change moves it between weeks. */
export function useSaveMealPlanItemMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Could not save the meal', pl: 'Nie udało się zapisać posiłku' }) },
      invalidateQueryKey: mealPlanKey,
    },
    mutationFn: (data: SaveMealPlanItemVariables) => saveMealPlanItem({ data }),
  });
}

export function useDeleteMealPlanItemMutation() {
  const { t } = useI18n();

  return useMutation({
    meta: {
      error: { title: t({ en: 'Could not delete the meal', pl: 'Nie udało się usunąć posiłku' }) },
      invalidateQueryKey: mealPlanKey,
    },
    mutationFn: (id: string) => deleteMealPlanItem({ data: { id } }),
  });
}
