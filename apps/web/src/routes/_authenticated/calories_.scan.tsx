import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { ScanFoodPage } from '@/pages/calories/ScanFoodPage';
import { normalizeCalorieDate } from '@/pages/calories/calorieDate';
export const Route = createFileRoute('/_authenticated/calories_/scan')({
  validateSearch: type({ 'date?': 'string' }),
  component: Component,
});
function Component() {
  const { date } = Route.useSearch();
  return <ScanFoodPage date={normalizeCalorieDate(date)} />;
}
