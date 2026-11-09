import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { CreateFoodPage } from '@/pages/calories/foods/CreateFoodPage';
import { caloriesDayTarget, normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

export const Route = createFileRoute('/_authenticated/calories_/foods_/new')({
  validateSearch: type({
    'barcode?': 'string',
    'date?': 'string',
    'log?': 'boolean',
    'name?': 'string',
  }),
  component: Component,
  staticData: {
    layout: 'task',
    navbar: {
      backFallback: caloriesDayTarget,
      label: { en: 'Create food product', pl: 'Utwórz produkt' },
    },
  },
});

function Component() {
  const search = Route.useSearch();
  return (
    <CreateFoodPage
      barcode={search.barcode}
      date={normalizeCalorieDate(search.date)}
      log={search.log ?? false}
      name={search.name}
    />
  );
}
