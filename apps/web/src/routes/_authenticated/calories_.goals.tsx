import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { CalorieGoalsPage } from '@/pages/calories/CalorieGoalsPage';
import { calorieDashboardQueryOptions } from '@/pages/calories/calorieQueries';
import { todayLocalDate } from '@/pages/calories/calorieDate';

export const Route = createFileRoute('/_authenticated/calories_/goals')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(calorieDashboardQueryOptions(todayLocalDate())),
  component: Component,
  staticData: {
    navbar: {
      label: 'Daily goals',
      upTo: { to: '/calories' },
    },
  },
});

function Component() {
  const { data: dashboard } = useSuspenseQuery(calorieDashboardQueryOptions(todayLocalDate()));
  const today = todayLocalDate();
  const goal = dashboard.days.find((day) => day.date === today)?.goal ?? null;

  return <CalorieGoalsPage goal={goal} />;
}
