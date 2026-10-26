import { type } from 'arktype';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { MealPlanPage } from '@/pages/meal-plan/MealPlanPage';
import { mealPlanWeekQueryOptions } from '@/pages/meal-plan/mealPlan.query';
import { calorieWeekStart, normalizeCalorieDate } from '@/pages/calories/calorieHelpers';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/meal-plan')({
  validateSearch: type({ 'date?': 'string' }),
  loaderDeps: ({ search }) => ({ weekStart: calorieWeekStart(normalizeCalorieDate(search.date)) }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData({
      ...mealPlanWeekQueryOptions(deps.weekStart),
      revalidateIfStale: true,
    }),
  component: RouteComponent,
  head: () => ({ meta: [{ title: translate({ en: 'Meal plan', pl: 'Plan posiłków' }) }] }),
  staticData: {
    layout: 'task',
    navbar: { backFallback: { to: '/' }, label: { en: 'Meal plan', pl: 'Plan posiłków' } },
  },
});

function RouteComponent() {
  const search = Route.useSearch();
  const date = normalizeCalorieDate(search.date);
  const { data: week } = useSuspenseQuery(mealPlanWeekQueryOptions(calorieWeekStart(date)));

  return <MealPlanPage date={date} focusDate={search.date !== undefined} week={week} />;
}
