import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { CaloriesPage } from '@/pages/calories/CaloriesPage';
import { getCalorieDashboard } from '@/pages/calories/calories.api';
import { normalizeCalorieDate } from '@/pages/calories/calorieDate';

export const Route = createFileRoute('/_authenticated/calories')({
  validateSearch: type({ 'date?': 'string' }),
  loaderDeps: ({ search }) => ({ date: normalizeCalorieDate(search.date) }),
  loader: ({ deps }) => getCalorieDashboard({ data: { date: deps.date } }),
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Food diary' }] }),
  staticData: { navbar: { label: 'Calories', upTo: { to: '/' } } },
});
function RouteComponent() {
  const dashboard = Route.useLoaderData();
  const { date } = Route.useLoaderDeps();
  return <CaloriesPage dashboard={dashboard} date={date} />;
}
