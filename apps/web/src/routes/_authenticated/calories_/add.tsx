import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { AddFoodPage } from '@/pages/calories/add/AddFoodPage';
import {
  calorieFoodQueryOptions,
  calorieFoodSearchQueryOptions,
} from '@/pages/calories/calorieQueries';
import { normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

export const Route = createFileRoute('/_authenticated/calories_/add')({
  validateSearch: type({ 'date?': 'string', 'foodId?': 'string' }),
  loaderDeps: ({ search }) => ({ foodId: search.foodId }),
  loader: ({ context, deps }) => {
    if (deps.foodId) {
      return context.queryClient.ensureQueryData(calorieFoodQueryOptions(deps.foodId));
    }

    return context.queryClient.ensureQueryData(calorieFoodSearchQueryOptions(''));
  },
  component: Component,
  staticData: {
    navbar: {
      label: 'Add food',
      upTo: { to: '/calories' },
    },
  },
});

function Component() {
  const search = Route.useSearch();
  return <AddFoodPage date={normalizeCalorieDate(search.date)} initialFoodId={search.foodId} />;
}
