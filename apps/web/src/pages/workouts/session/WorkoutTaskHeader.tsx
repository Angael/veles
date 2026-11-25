import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { workoutSessionQueryOptions } from '../workouts.query';
import { FinishWorkoutButton } from './FinishWorkoutButton';
import { RoutineReviewDialog } from './RoutineReviewDialog';
import { SessionMenu } from './SessionMenu';
import { useFinishRoutineReview } from './useFinishRoutineReview';

/** The open session, already loaded by the route; the task header renders outside the page. */
function useRouteSession() {
  const { id } = useParams({ from: '/_authenticated/workouts/$id' });
  return useSuspenseQuery(workoutSessionQueryOptions(id)).data;
}

/**
 * Finish while the session runs, then the rare actions menu. The routine review after Finish
 * lives here because Finish unmounts once the workout ends. The explicit return type keeps the
 * route's inferred type from depending on this body.
 */
export function WorkoutActions(): ReactNode {
  const session = useRouteSession();
  const review = useFinishRoutineReview(session.id);
  return (
    <>
      {session.endedAt === null ? (
        <FinishWorkoutButton onFinished={review.afterFinish} workoutId={session.id} />
      ) : null}
      <SessionMenu session={session} />
      <RoutineReviewDialog
        conflict={review.conflict}
        onKeep={review.keep}
        onReviewAgain={() => void review.reviewAgain()}
        onUpdate={() => void review.update()}
        pending={review.pending}
        reloading={review.reloading}
        review={review.review}
      />
    </>
  );
}

/** Session name as the task header title. */
export function useWorkoutLabel(): string {
  return useRouteSession().name;
}
