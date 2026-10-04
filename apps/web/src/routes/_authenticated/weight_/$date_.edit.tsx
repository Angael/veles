import { createFileRoute } from '@tanstack/react-router';
import { EditWeightEntryPage } from '@/pages/weight/entry/EditWeightEntryPage';
import { getWeightEntry } from '@/pages/weight/weight.api';

export const Route = createFileRoute('/_authenticated/weight_/$date_/edit')({
  loader: ({ params }) => getWeightEntry({ data: { date: params.date } }),
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Edit weight' }] }),
  staticData: {
    layout: 'task',
    navbar: {
      backFallback: ({ params }) => ({ params: { date: params.date ?? '' }, to: '/weight/$date' }),
      label: 'Edit weight',
    },
  },
});

function RouteComponent() {
  const entry = Route.useLoaderData();

  return <EditWeightEntryPage entry={entry} key={entry.date} />;
}
