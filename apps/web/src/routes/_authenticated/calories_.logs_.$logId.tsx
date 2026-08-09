import { createFileRoute } from '@tanstack/react-router';
import { EditFoodLogPage } from '@/pages/calories/EditFoodLogPage';
import { getFoodLog } from '@/pages/calories/calories.api';
export const Route = createFileRoute('/_authenticated/calories_/logs_/$logId')({
  loader: ({ params }) => getFoodLog({ data: { id: params.logId } }),
  component: Component,
});
function Component() {
  return <EditFoodLogPage log={Route.useLoaderData()} />;
}
