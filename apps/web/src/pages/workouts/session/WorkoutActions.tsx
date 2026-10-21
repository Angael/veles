import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { workoutSessionQueryOptions } from '../workouts.query';
import { SessionMenu } from './SessionMenu';

/** The open session, already loaded by the route; the task header renders outside the page. */
function useRouteSession() {
  const { id } = useParams({ from: '/_authenticated/workouts/$id' });
  return useSuspenseQuery(workoutSessionQueryOptions(id)).data;
}

export function WorkoutActions() {
  return <SessionMenu session={useRouteSession()} />;
}
