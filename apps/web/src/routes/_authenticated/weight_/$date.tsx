import { createFileRoute } from '@tanstack/react-router';
import { WeightEntryPage } from '@/pages/weight/entry/WeightEntryPage';
import { getWeightEntry } from '@/pages/weight/weight.api';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/weight_/$date')({
  loader: ({ params }) => getWeightEntry({ data: { date: params.date } }),
  component: RouteComponent,
  head: () => ({ meta: [{ title: translate({ en: 'Weight entry', pl: 'Pomiar wagi' }) }] }),
  staticData: {
    navbar: { backFallback: { to: '/weight' }, label: { en: 'Weight entry', pl: 'Pomiar wagi' } },
  },
});

function RouteComponent() {
  return <WeightEntryPage entry={Route.useLoaderData()} />;
}
