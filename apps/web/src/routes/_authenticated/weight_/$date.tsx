import { createFileRoute } from '@tanstack/react-router';
import { WeightEntryPage } from '@/pages/weight/entry/WeightEntryPage';
import { getWeightEntry } from '@/pages/weight/weight.api';

export const Route = createFileRoute('/_authenticated/weight_/$date')({
  loader: ({ params }) => getWeightEntry({ data: { date: params.date } }),
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Weight entry' }] }),
  staticData: { navbar: { backFallback: { to: '/weight' }, label: 'Weight entry' } },
});

function RouteComponent() {
  return <WeightEntryPage entry={Route.useLoaderData()} />;
}
