import { createFileRoute } from '@tanstack/react-router';
import { CalorieGoalsPage } from '@/pages/calories/CalorieGoalsPage';
import { getCalorieDashboard } from '@/pages/calories/calories.api';
import { todayLocalDate } from '@/pages/calories/calorieDate';

export const Route = createFileRoute('/_authenticated/calories_/goals')({
  loader: () => getCalorieDashboard({ data: { date: todayLocalDate() } }),
  component: Component,
  staticData: {
    navbar: {
      label: 'Daily goals',
      upTo: { to: '/calories' },
    },
  },
});

function Component() {
  return <CalorieGoalsPage goal={Route.useLoaderData().goal} />;
}
