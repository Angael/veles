import { type } from 'arktype';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { CaloriesPage } from '@/pages/calories/dashboard/CaloriesPage';
import { calorieDashboardQueryOptions } from '@/pages/calories/calorieQueries';
import { calorieWeekStart, normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

export const Route = createFileRoute('/_authenticated/calories')({
  validateSearch: type({ 'date?': 'string' }),
  loaderDeps: ({ search }) => ({
    weekStart: calorieWeekStart(normalizeCalorieDate(search.date)),
  }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData({
      ...calorieDashboardQueryOptions(deps.weekStart),
      revalidateIfStale: true,
    }),
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Food diary' }] }),
  staticData: { navbar: { label: 'Calories', upTo: { to: '/' } } },
});
function RouteComponent() {
  const search = Route.useSearch();
  const date = normalizeCalorieDate(search.date);
  const { data: dashboard } = useSuspenseQuery(calorieDashboardQueryOptions(date));

  return <CaloriesPage dashboard={dashboard} date={date} />;
}
