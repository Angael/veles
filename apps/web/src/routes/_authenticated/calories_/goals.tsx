import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { CalorieGoalsPage } from '@/pages/calories/goals/CalorieGoalsPage';
import { calorieDashboardQueryOptions } from '@/pages/calories/calories.query';
import { todayLocalDate } from '@/lib/dateOnly';
import { getLatestWeightKg } from '@/pages/calories/goals/goals.api';

export const Route = createFileRoute('/_authenticated/calories_/goals')({
  loader: async ({ context }) => {
    const [, latestWeightKg] = await Promise.all([
      context.queryClient.ensureQueryData(calorieDashboardQueryOptions(todayLocalDate())),
      getLatestWeightKg(),
    ]);

    return { latestWeightKg };
  },
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
  const { latestWeightKg } = Route.useLoaderData();
  const today = todayLocalDate();
  const goal = dashboard.days.find((day) => day.date === today)?.goal ?? null;

  return <CalorieGoalsPage goal={goal} latestWeightKg={latestWeightKg} />;
}
