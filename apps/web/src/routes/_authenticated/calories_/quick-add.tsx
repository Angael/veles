import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { QuickAddPage } from '@/pages/calories/add/QuickAddPage';
import { normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

const quickAddSearchType = type({
  'carbs?': 'number >= 0',
  'date?': 'string',
  'fat?': 'number >= 0',
  'kcal?': 'number >= 0',
  'name?': 'string',
  'protein?': 'number >= 0',
});

export const Route = createFileRoute('/_authenticated/calories_/quick-add')({
  validateSearch: quickAddSearchType,
  component: Component,
  staticData: {
    layout: 'focus',
  },
});

function Component() {
  const { carbs, date, fat, kcal, name, protein } = Route.useSearch();
  return (
    <QuickAddPage
      date={normalizeCalorieDate(date)}
      defaultValues={{ carbs, fat, kcal, name, protein }}
    />
  );
}
