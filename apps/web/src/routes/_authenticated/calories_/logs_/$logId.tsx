import { createFileRoute } from '@tanstack/react-router';
import { EditFoodLogPage } from '@/pages/calories/logs/EditFoodLogPage';
import { getFoodLog } from '@/pages/calories/calories.api';

export const Route = createFileRoute('/_authenticated/calories_/logs_/$logId')({
  loader: ({ params }) => getFoodLog({ data: { id: params.logId } }),
  component: Component,
  staticData: {
    navbar: {
      label: 'Edit food log',
      upTo: { to: '/calories' },
    },
  },
});

function Component() {
  return <EditFoodLogPage log={Route.useLoaderData()} />;
}
