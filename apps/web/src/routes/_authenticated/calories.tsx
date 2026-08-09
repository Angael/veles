import { createFileRoute } from '@tanstack/react-router';
import { format } from 'date-fns';
import { CaloriesPage } from '@/pages/calories/CaloriesPage';
import { getCalorieDashboard } from '@/pages/calories/calories.api';

export const Route = createFileRoute('/_authenticated/calories')({
  loader: async () => {
    const date = format(new Date(), 'yyyy-MM-dd');
    const dashboard = await getCalorieDashboard({ data: { date } });
    return { dashboard, date };
  },
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Daily calories' }] }),
  staticData: { navbar: { label: 'Calories', upTo: { to: '/' } } },
});

function RouteComponent() {
  const { dashboard, date } = Route.useLoaderData();
  return <CaloriesPage dashboard={dashboard} date={date} />;
}
