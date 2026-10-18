import { createFileRoute } from '@tanstack/react-router';
import { WorkoutSessionPage } from '@/pages/workouts/session/WorkoutSessionPage';
import { workoutSessionQueryOptions } from '@/pages/workouts/workouts.query';

export const Route = createFileRoute('/_authenticated/workouts/$id')({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(workoutSessionQueryOptions(params.id)),
  component: RouteComponent,
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.name ?? 'Workout' }] }),
  staticData: {
    layout: 'task',
    navbar: { backFallback: { to: '/workouts' }, label: 'Workout' },
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <WorkoutSessionPage key={id} workoutId={id} />;
}
