import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { QuickAddPage } from '@/pages/calories/add/QuickAddPage';
import { normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

export const Route = createFileRoute('/_authenticated/calories_/quick-add')({
  validateSearch: type({ 'date?': 'string' }),
  component: Component,
  staticData: {
    layout: 'focus',
  },
});

function Component() {
  const { date } = Route.useSearch();
  return <QuickAddPage date={normalizeCalorieDate(date)} />;
}
