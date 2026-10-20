import { createFileRoute } from '@tanstack/react-router';
import { EditWeightEntryPage } from '@/pages/weight/entry/EditWeightEntryPage';
import { getWeightEntry } from '@/pages/weight/weight.api';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/weight_/$date_/edit')({
  loader: ({ params }) => getWeightEntry({ data: { date: params.date } }),
  component: RouteComponent,
  head: () => ({ meta: [{ title: translate({ en: 'Edit weight', pl: 'Edytuj wagę' }) }] }),
  staticData: {
    layout: 'task',
    navbar: {
      backFallback: ({ params }) => ({ params: { date: params.date ?? '' }, to: '/weight/$date' }),
      label: { en: 'Edit weight', pl: 'Edytuj wagę' },
    },
  },
});

function RouteComponent() {
  const entry = Route.useLoaderData();

  return <EditWeightEntryPage entry={entry} key={entry.date} />;
}
