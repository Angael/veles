import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { QuickAddPage } from '@/pages/calories/QuickAddPage';
import { normalizeCalorieDate } from '@/pages/calories/calorieDate';

export const Route = createFileRoute('/_authenticated/calories_/quick-add')({
  validateSearch: type({ 'date?': 'string' }),
  component: Component,
});

function Component() {
  const { date } = Route.useSearch();
  return <QuickAddPage date={normalizeCalorieDate(date)} />;
}
