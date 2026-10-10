import { createFileRoute } from '@tanstack/react-router';
import { RoutinePage } from '@/pages/workouts/routines/RoutinePage';
import { routineQueryOptions } from '@/pages/workouts/routines/routines.query';
import { workoutsQueryOptions } from '@/pages/workouts/workouts.query';

export const Route = createFileRoute('/_authenticated/workouts/routines/$id')({
  loader: async ({ context: { queryClient }, params }) => {
    const [routine] = await Promise.all([
      queryClient.ensureQueryData(routineQueryOptions(params.id)),
      queryClient.ensureQueryData(workoutsQueryOptions()),
    ]);
    return routine;
  },
  component: RouteComponent,
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.name ?? 'Routine' }] }),
  staticData: {
    layout: 'task',
    navbar: { backFallback: { to: '/workouts' }, label: 'Routine' },
  },
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <RoutinePage key={id} routineId={id} />;
}
