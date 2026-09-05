import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { CreateFoodPage } from '@/pages/calories/foods/CreateFoodPage';
import { normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

export const Route = createFileRoute('/_authenticated/calories_/foods_/new')({
  validateSearch: type({ 'barcode?': 'string', 'date?': 'string', 'name?': 'string' }),
  component: Component,
  staticData: {
    navbar: {
      label: 'Create food',
      upTo: { to: '/calories' },
    },
  },
});

function Component() {
  const search = Route.useSearch();
  return (
    <CreateFoodPage
      barcode={search.barcode}
      date={normalizeCalorieDate(search.date)}
      name={search.name}
    />
  );
}
