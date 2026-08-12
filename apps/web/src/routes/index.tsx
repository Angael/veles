import { createFileRoute } from '@tanstack/react-router';
import { HomeDashboard } from '@/pages/home/HomeDashboard';
import { HomePage } from '@/pages/home/HomePage';
import { getHomeDashboard } from '@/pages/home/home.api';

export const Route = createFileRoute('/')({
  loader: ({ context }) => (context.user ? getHomeDashboard() : null),
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useRouteContext();
  const dashboard = Route.useLoaderData();

  return user && dashboard ? <HomeDashboard data={dashboard} user={user} /> : <HomePage />;
}
