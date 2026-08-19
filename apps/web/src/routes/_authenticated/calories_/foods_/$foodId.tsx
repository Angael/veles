import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { EditFoodPage } from '@/pages/calories/foods/EditFoodPage';
import { calorieFoodQueryOptions } from '@/pages/calories/calorieQueries';

export const Route = createFileRoute('/_authenticated/calories_/foods_/$foodId')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(calorieFoodQueryOptions(params.foodId)),
  component: Component,
  staticData: {
    navbar: {
      label: 'Edit food',
      upTo: { to: '/calories' },
    },
  },
});

function Component() {
  const { foodId } = Route.useParams();
  const { data: food } = useSuspenseQuery(calorieFoodQueryOptions(foodId));

  return <EditFoodPage food={food} />;
}
