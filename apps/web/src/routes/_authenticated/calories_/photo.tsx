import { type } from 'arktype';
import { createFileRoute } from '@tanstack/react-router';
import { PhotoScanPage } from '@/pages/calories/photo-scan/PhotoScanPage';
import { caloriesDayTarget, normalizeCalorieDate } from '@/pages/calories/calorieHelpers';

export const Route = createFileRoute('/_authenticated/calories_/photo')({
  validateSearch: type({ 'date?': 'string' }),
  component: Component,
  staticData: {
    layout: 'task',
    navbar: {
      backFallback: caloriesDayTarget,
      label: { en: 'Log from photos', pl: 'Dodaj ze zdjęć' },
    },
  },
});

function Component() {
  return <PhotoScanPage date={normalizeCalorieDate(Route.useSearch().date)} />;
}
