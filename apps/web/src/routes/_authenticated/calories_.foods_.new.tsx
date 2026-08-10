import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { CreateFoodPage } from '@/pages/calories/CreateFoodPage';
import { normalizeCalorieDate } from '@/pages/calories/calorieDate';
export const Route = createFileRoute('/_authenticated/calories_/foods_/new')({
  validateSearch: type({ 'barcode?': 'string', 'date?': 'string', 'name?': 'string' }),
  component: Component,
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
