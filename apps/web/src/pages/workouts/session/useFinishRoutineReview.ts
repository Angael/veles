import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toastManager } from '@/components/ui/toast/toastManager';
import {
  RoutineChangedError,
  routineQueryOptions,
  useUpdateRoutineFromWorkoutMutation,
} from '../routines/routines.query';
import { workoutSessionQueryOptions } from '../workouts.query';
import { type RoutineReview, reviewRoutineChanges } from './routineReview';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Fresh finished session and its routine, compared; null when there is nothing to ask. */
async function loadRoutineReview(queryClient: QueryClient, workoutId: string) {
  const session = await queryClient.fetchQuery({
    ...workoutSessionQueryOptions(workoutId),
    staleTime: 0,
  });
  if (!session.routine) return null;
  const routine = await queryClient.fetchQuery({
    ...routineQueryOptions(session.routine.id),
    staleTime: 0,
  });
  return reviewRoutineChanges(session, routine);
}

/**
 * The step after Finish for a workout started from a routine. Once the workout is saved, it
 * compares the workout with the routine and, only when the plan changed, asks whether to update
 * the routine. Keeping, closing the dialog, or failing to compare all leave the routine as it
 * was; a failed update keeps the review open. If the routine changed elsewhere after the review
 * opened, nothing is written and the review offers Keep or a fresh comparison. Lives in the task
 * header, which stays mounted after Finish itself disappears.
 */
export function useFinishRoutineReview(workoutId: string) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const updateRoutine = useUpdateRoutineFromWorkoutMutation();
  const [review, setReview] = useState<RoutineReview | null>(null);
  const [conflict, setConflict] = useState(false);
  const [reloading, setReloading] = useState(false);

  const leave = () => void navigate({ replace: true, to: '/workouts' });

  /** Fresh comparison, or a toast and `undefined` when it could not be made. */
  async function compare() {
    try {
      return await loadRoutineReview(queryClient, workoutId);
    } catch {
      toastManager.add({
        description: t({
          en: 'Your workout is saved; the routine stays as it was.',
          pl: 'Trening jest zapisany; plan zostaje bez zmian.',
        }),
        title: t({
          en: 'Could not compare with the routine',
          pl: 'Nie udało się porównać z planem',
        }),
        type: 'error',
      });
      return undefined;
    }
  }

  async function afterFinish() {
    const next = await compare();
    if (next) setReview(next);
    else leave();
  }

  /** After a conflict: compares again with the routine as it is now. */
  async function reviewAgain() {
    setReloading(true);
    const next = await compare();
    setReloading(false);
    // A failed comparison keeps the conflict on screen, so Keep stays one tap away.
    if (next === undefined) return;
    setConflict(false);
    if (next) setReview(next);
    else close();
  }

  function close() {
    setReview(null);
    setConflict(false);
    leave();
  }

  function keep() {
    if (updateRoutine.isPending || reloading) return;
    close();
  }

  async function update() {
    if (!review || conflict || updateRoutine.isPending) return;
    const { plan, reviewed, routineId } = review;
    try {
      await updateRoutine.mutateAsync({ exercises: plan, reviewed, routineId, workoutId });
    } catch (error) {
      // The mutation meta shows the error toast; the review stays open to retry or keep.
      if (error instanceof RoutineChangedError) setConflict(true);
      return;
    }
    close();
  }

  return {
    afterFinish,
    conflict,
    keep,
    pending: updateRoutine.isPending,
    reloading,
    review,
    reviewAgain,
    update,
  };
}
