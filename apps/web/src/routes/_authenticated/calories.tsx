import { type } from 'arktype';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { CaloriesPage } from '@/pages/calories/dashboard/CaloriesPage';
import { calorieDashboardQueryOptions } from '@/pages/calories/calories.query';
import { receivedFoodLogSharesQueryOptions } from '@/pages/calories/dashboard/foodLogShares.query';
import { calorieWeekStart, normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

export const Route = createFileRoute('/_authenticated/calories')({
  validateSearch: type({ 'date?': 'string', 'foodId?': 'string' }),
  loaderDeps: ({ search }) => ({
    weekStart: calorieWeekStart(normalizeCalorieDate(search.date)),
  }),
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData({
        ...calorieDashboardQueryOptions(deps.weekStart),
        revalidateIfStale: true,
      }),
      // Shares are secondary: prefetch never throws, so a failure can't block the diary.
      context.queryClient.prefetchQuery(receivedFoodLogSharesQueryOptions()),
    ]),
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Food diary' }] }),
  staticData: { navbar: { label: 'Calories' } },
});
function RouteComponent() {
  const search = Route.useSearch();
  const date = normalizeCalorieDate(search.date);
  const { data: dashboard } = useSuspenseQuery(calorieDashboardQueryOptions(date));

  return <CaloriesPage dashboard={dashboard} date={date} linkedFoodId={search.foodId} />;
}
