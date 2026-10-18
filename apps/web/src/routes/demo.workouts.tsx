import { createFileRoute } from '@tanstack/react-router';
import { WorkoutsDemoPage } from '@/pages/workouts-demo/WorkoutsDemoPage';

export const Route = createFileRoute('/demo/workouts')({
  component: WorkoutsDemoPage,
  head: () => ({ meta: [{ title: 'Workouts playground' }] }),
  staticData: {
    navbar: {
      label: 'Workouts playground',
      backFallback: { to: '/' },
    },
  },
});
