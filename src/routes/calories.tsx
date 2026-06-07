import { createFileRoute } from '@tanstack/react-router';
import { PlaceholderPage } from '@/pages/placeholder/PlaceholderPage';

export const Route = createFileRoute('/calories')({
  component: CaloriesPage,
  head: () => ({ meta: [{ title: 'Calorie tracker' }] }),
});

function CaloriesPage() {
  return (
    <PlaceholderPage
      description='Placeholder route for the future calorie tracker mobile entry point.'
      eyebrow='Tracker'
      title='Calorie tracker'
    />
  );
}
