import { createFileRoute } from '@tanstack/react-router';
import { EditFoodPage } from '@/pages/calories/EditFoodPage';
import { getFoodProduct } from '@/pages/calories/calories.api';

export const Route = createFileRoute('/_authenticated/calories_/foods_/$foodId')({
  loader: ({ params }) => getFoodProduct({ data: { id: params.foodId } }),
  component: Component,
  staticData: {
    navbar: {
      label: 'Edit food',
      upTo: { to: '/calories' },
    },
  },
});

function Component() {
  return <EditFoodPage food={Route.useLoaderData()} />;
}
