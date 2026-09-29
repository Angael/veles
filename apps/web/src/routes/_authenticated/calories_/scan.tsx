import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { ScanFoodPage } from '@/pages/calories/add/ScanFoodPage';
import { caloriesDayTarget, normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

export const Route = createFileRoute('/_authenticated/calories_/scan')({
  validateSearch: type({ 'date?': 'string' }),
  component: Component,
  staticData: {
    layout: 'immersive',
    navbar: { backFallback: caloriesDayTarget, label: 'Scan barcode' },
  },
});

function Component() {
  return <ScanFoodPage initialDate={normalizeCalorieDate(Route.useSearch().date)} />;
}
