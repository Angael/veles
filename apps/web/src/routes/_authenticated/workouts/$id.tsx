import { createFileRoute } from '@tanstack/react-router';
import { WorkoutSessionPage } from '@/pages/workouts/session/WorkoutSessionPage';
import { workoutSessionQueryOptions } from '@/pages/workouts/workouts.query';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/workouts/$id')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(workoutSessionQueryOptions(params.id)),
  component: RouteComponent,
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.name ?? translate({ en: 'Workout', pl: 'Trening' }) }],
  }),
  staticData: {
    layout: 'task',
    navbar: { backFallback: { to: '/workouts' }, label: { en: 'Workout', pl: 'Trening' } },
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <WorkoutSessionPage key={id} workoutId={id} />;
}
