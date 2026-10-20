import { type } from 'arktype';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { EditFoodPage } from '@/pages/calories/foods/EditFoodPage';
import { calorieFoodQueryOptions } from '@/pages/calories/calories.query';
import { normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

export const Route = createFileRoute('/_authenticated/calories_/foods_/$foodId')({
  validateSearch: type({ 'date?': 'string', 'from?': "'add'" }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(calorieFoodQueryOptions(params.foodId)),
  component: Component,
  staticData: {
    layout: 'task',
    navbar: { backFallback: { to: '/calories' }, label: { en: 'Edit food', pl: 'Edytuj produkt' } },
  },
});

function Component() {
  const { foodId } = Route.useParams();
  const search = Route.useSearch();
  const { data: food } = useSuspenseQuery(calorieFoodQueryOptions(foodId));

  return (
    <EditFoodPage
      addFoodDate={search.from === 'add' ? normalizeCalorieDate(search.date) : undefined}
      food={food}
    />
  );
}
