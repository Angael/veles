import { createFileRoute } from '@tanstack/react-router';
import { exerciseLibraryQueryOptions } from '@/pages/workouts/exercises/exercises.query';
import { ExerciseLibraryPage } from '@/pages/workouts/exercises/library/ExerciseLibraryPage';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/workouts/exercises')({
  loader: ({ context }) => context.queryClient.ensureQueryData(exerciseLibraryQueryOptions()),
  component: ExerciseLibraryPage,
  head: () => ({ meta: [{ title: translate({ en: 'Exercises', pl: 'Ćwiczenia' }) }] }),
  staticData: {
    layout: 'task',
    navbar: {
      backFallback: { to: '/workouts' },
      label: { en: 'Exercises', pl: 'Ćwiczenia' },
    },
  },
});
