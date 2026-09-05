import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { ScanFoodPage } from '@/pages/calories/add/ScanFoodPage';
import { normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

export const Route = createFileRoute('/_authenticated/calories_/scan')({
  validateSearch: type({ 'date?': 'string' }),
  component: Component,
  staticData: {
    navbar: {
      label: 'Look up barcode',
      upTo: { to: '/calories' },
    },
  },
});

function Component() {
  return <ScanFoodPage initialDate={normalizeCalorieDate(Route.useSearch().date)} />;
}
