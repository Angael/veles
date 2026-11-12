import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { workoutSessionQueryOptions } from '../workouts.query';
import { FinishWorkoutButton } from './FinishWorkoutButton';
import { SessionMenu } from './SessionMenu';

/** The open session, already loaded by the route; the task header renders outside the page. */
function useRouteSession() {
  const { id } = useParams({ from: '/_authenticated/workouts/$id' });
  return useSuspenseQuery(workoutSessionQueryOptions(id)).data;
}

/**
 * Finish while the session runs, then the rare actions menu. The explicit return type keeps the
 * route's inferred type from depending on this body.
 */
export function WorkoutActions(): ReactNode {
  const session = useRouteSession();
  return (
    <>
      {session.endedAt === null ? <FinishWorkoutButton workoutId={session.id} /> : null}
      <SessionMenu session={session} />
    </>
  );
}

/** Session name as the task header title. */
export function useWorkoutLabel(): string {
  return useRouteSession().name;
}
