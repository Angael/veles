import { createFileRoute } from '@tanstack/react-router';
import { WeightPage } from '@/pages/weight/WeightPage';
import { getWeightChartRange, getWeightEntries } from '@/pages/weight/weight.api';

export const Route = createFileRoute('/_authenticated/weight')({
  loader: async () => {
    const [entries, initialChartRange] = await Promise.all([
      getWeightEntries(),
      getWeightChartRange(),
    ]);

    return { entries, initialChartRange };
  },
  component: RouteComponent,
  staticData: { navbar: { label: 'Weight', upTo: { to: '/' } } },
});

function RouteComponent() {
  const { entries, initialChartRange } = Route.useLoaderData();

  return <WeightPage entries={entries} initialChartRange={initialChartRange} />;
}
