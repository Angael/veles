import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { AddFoodPage } from '@/pages/calories/AddFoodPage';
import { normalizeCalorieDate } from '@/pages/calories/calorieDate';
export const Route = createFileRoute('/_authenticated/calories_/add')({
  validateSearch: type({ 'date?': 'string', 'foodId?': 'string' }),
  component: Component,
});
function Component() {
  const search = Route.useSearch();
  return <AddFoodPage date={normalizeCalorieDate(search.date)} initialFoodId={search.foodId} />;
}
