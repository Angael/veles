import { createFileRoute } from '@tanstack/react-router';
import { HomeDashboard } from '@/pages/home/HomeDashboard';
import { HomePage } from '@/pages/home/HomePage';
import { getHomeDashboard } from '@/pages/home/home.api';
import { todayLocalDate } from '@/pages/calories/calorieDate';

export const Route = createFileRoute('/')({
  loaderDeps: () => ({ date: todayLocalDate() }),
  loader: ({ context, deps }) =>
    context.user ? getHomeDashboard({ data: { date: deps.date } }) : null,
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const dashboard = Route.useLoaderData();

  if (user && dashboard) return <HomeDashboard data={dashboard} />;

  return <HomePage />;
}
