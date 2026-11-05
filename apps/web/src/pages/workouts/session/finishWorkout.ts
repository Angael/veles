import { clearStoredRestTimer } from '../rest/useRestTimer';

type FinishWorkoutDeps = {
  /** `useMutation().mutateAsync`; its promise settles even if the caller unmounted meanwhile. */
  finish: (variables: { finished: true; id: string }) => Promise<unknown>;
  leave: () => void;
};

/**
 * Finishes a workout, drops its rest timer, then leaves. Awaits the mutation promise instead of
 * per-call `mutate` callbacks: the invalidation refetch can end the workout in the cache and
 * unmount the Finish button first, and TanStack Query drops callbacks of unmounted observers.
 */
export async function finishWorkout(id: string, { finish, leave }: FinishWorkoutDeps) {
  try {
    await finish({ finished: true, id });
  } catch {
    // The mutation meta shows the error toast; the user stays on the workout.
    return;
  }
  clearStoredRestTimer();
  leave();
}
