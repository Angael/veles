import { createFileRoute } from '@tanstack/react-router';
import { WeightPage } from '@/pages/weight/WeightPage';
import { getWeightEntries } from '@/pages/weight/weight.api';

export const Route = createFileRoute('/_authenticated/weight')({
  loader: () => getWeightEntries(),
  component: RouteComponent,
  staticData: { navbar: { label: 'Weight', upTo: { to: '/' } } },
});

function RouteComponent() {
  const entries = Route.useLoaderData();

  return <WeightPage entries={entries} />;
}
