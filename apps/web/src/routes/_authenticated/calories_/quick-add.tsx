import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { QuickAddPage } from '@/pages/calories/add/QuickAddPage';
import { normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

const quickAddSearchType = type({
  'carbs?': 'string.numeric.parse |> number >= 0',
  'date?': 'string',
  'fat?': 'string.numeric.parse |> number >= 0',
  'kcal?': 'string.numeric.parse |> number >= 0',
  'name?': 'string',
  'protein?': 'string.numeric.parse |> number >= 0',
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
