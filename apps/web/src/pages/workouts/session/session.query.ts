import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { exerciseKeys } from '../exercises/exercises.query';
import { updateExercise } from '../exercises/exercises.api';
import type { Measure, SetMetrics, SetType } from '../metrics';
import { workoutKeys } from '../workouts.query';
import type { WorkoutSessionData, WorkoutSetData, WorkoutSlotData } from '../workouts.server';
import {
  addWorkoutExercise,
  addWorkoutSet,
  deleteWorkoutSet,
  duplicateWorkoutSet,
  moveWorkoutExercise,
  removeWorkoutExercise,
  updateWorkoutExercise,
  updateWorkoutSet,
} from './session.api';

export type SetPatch = Partial<SetMetrics & { type: SetType; done: boolean }>;
export type ExercisePatch = { name?: string; measure?: Measure; restSeconds?: number | null };
export type SessionActions = ReturnType<typeof useSessionActions>;

/** Typing pauses this long before a dragged value is sent, so a drag is one request. */
const SAVE_DELAY_MS = 600;

const mapSlots = (
  session: WorkoutSessionData,
  update: (slot: WorkoutSlotData) => WorkoutSlotData | null,
): WorkoutSessionData => ({
  ...session,
  slots: session.slots.flatMap((slot) => update(slot) ?? []),
});

const mapSet = (
  session: WorkoutSessionData,
  setId: string,
  update: (set: WorkoutSetData) => WorkoutSetData | null,
) =>
  mapSlots(session, (slot) => ({
    ...slot,
    sets: slot.sets.flatMap((set) => (set.id === setId ? (update(set) ?? []) : [set])),
  }));

type SessionMutationOptions<V> = {
  error: string;
  mutationFn: (variables: V) => Promise<unknown>;
  /** Applied to the cached session before the request, so the screen reacts at once. */
  optimistic?: (session: WorkoutSessionData, variables: V) => WorkoutSessionData;
  invalidateExercises?: boolean;
};

/**
 * A session mutation that patches the cache first and refetches only after the last one in
 * flight settles, so quick taps never flicker back to stale server data.
 */
function useSessionMutation<V>(
  workoutId: string,
  hasPendingEdits: () => boolean,
  options: SessionMutationOptions<V>,
) {
  const queryKey = workoutKeys.session(workoutId);
  const mutationKey = ['workouts', 'session-mutation', workoutId];
  return useMutation({
    meta: { error: { title: options.error } },
    mutationFn: options.mutationFn,
    mutationKey,
    onMutate: async (variables, context) => {
      const { optimistic } = options;
      if (!optimistic) return;
      await context.client.cancelQueries({ queryKey });
      context.client.setQueryData<WorkoutSessionData>(
        queryKey,
        (session) => session && optimistic(session, variables),
      );
    },
    onSettled: async (_data, _error, _variables, _onMutateResult, context) => {
      if (options.invalidateExercises) {
        await context.client.invalidateQueries({ queryKey: exerciseKeys.all });
      }
      if (context.client.isMutating({ mutationKey }) > 1 || hasPendingEdits()) return;
      await context.client.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Every edit on the live session screen. Each change is saved to the server right away (dragged
 * values after a short pause), so a dead phone mid-workout loses nothing.
 */
export function useSessionActions(workoutId: string) {
  const queryClient = useQueryClient();
  const queryKey = workoutKeys.session(workoutId);
  const pending = useRef(new Map<string, { patch: SetPatch; timer: number }>());
  const hasPendingEdits = () => pending.current.size > 0;

  const setMutation = useSessionMutation(workoutId, hasPendingEdits, {
    error: 'Set was not saved',
    mutationFn: (variables: SetPatch & { id: string }) => updateWorkoutSet({ data: variables }),
  });
  const addSet = useSessionMutation(workoutId, hasPendingEdits, {
    error: 'Set was not added',
    mutationFn: (sessionExerciseId: string) => addWorkoutSet({ data: { sessionExerciseId } }),
  });
  const duplicateSet = useSessionMutation(workoutId, hasPendingEdits, {
    error: 'Set was not copied',
    mutationFn: (id: string) => duplicateWorkoutSet({ data: { id } }),
  });
  const removeSet = useSessionMutation(workoutId, hasPendingEdits, {
    error: 'Set was not deleted',
    mutationFn: (id: string) => deleteWorkoutSet({ data: { id } }),
    optimistic: (session, id) => mapSet(session, id, () => null),
  });
  const addExercise = useSessionMutation(workoutId, hasPendingEdits, {
    error: 'Exercise was not added',
    invalidateExercises: true,
    mutationFn: (
      variables: { exerciseId: string } | { newExercise: { name: string; measure: Measure } },
    ) => addWorkoutExercise({ data: { workoutId, ...variables } }),
  });
  const updateNote = useSessionMutation(workoutId, hasPendingEdits, {
    error: 'Note was not saved',
    mutationFn: (variables: { id: string; notes: string }) =>
      updateWorkoutExercise({ data: variables }),
    optimistic: (session, { id, notes }) =>
      mapSlots(session, (slot) => (slot.id === id ? { ...slot, note: notes } : slot)),
  });
  const moveSlot = useSessionMutation(workoutId, hasPendingEdits, {
    error: 'Exercise was not moved',
    mutationFn: (variables: { id: string; direction: 'up' | 'down' }) =>
      moveWorkoutExercise({ data: variables }),
    optimistic: (session, { direction, id }) => {
      const slots = [...session.slots];
      const index = slots.findIndex((slot) => slot.id === id);
      const target = index + (direction === 'up' ? -1 : 1);
      const [moving, other] = [slots[index], slots[target]];
      if (!moving || !other) return session;
      [slots[index], slots[target]] = [other, moving];
      return { ...session, slots };
    },
  });
  const removeSlot = useSessionMutation(workoutId, hasPendingEdits, {
    error: 'Exercise was not removed',
    mutationFn: (id: string) => removeWorkoutExercise({ data: { id } }),
    optimistic: (session, id) => mapSlots(session, (slot) => (slot.id === id ? null : slot)),
  });
  const exerciseMutation = useSessionMutation(workoutId, hasPendingEdits, {
    error: 'Exercise was not saved',
    invalidateExercises: true,
    mutationFn: (variables: ExercisePatch & { id: string }) => updateExercise({ data: variables }),
    optimistic: (session, { id, ...patch }) =>
      mapSlots(session, (slot) => (slot.exerciseId === id ? { ...slot, ...patch } : slot)),
  });

  function flush(setId: string) {
    const entry = pending.current.get(setId);
    if (!entry) return;
    window.clearTimeout(entry.timer);
    pending.current.delete(setId);
    setMutation.mutate({ id: setId, ...entry.patch });
  }

  const flushAll = useRef(() => {});
  flushAll.current = () => [...pending.current.keys()].forEach(flush);

  // Phones kill hidden tabs; send waiting edits before that and when leaving the screen.
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && flushAll.current();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      flushAll.current();
    };
  }, []);

  return {
    addExercise: addExercise.mutate,
    addSet: addSet.mutate,
    duplicateSet: duplicateSet.mutate,
    moveSlot: (id: string, direction: 'up' | 'down') => moveSlot.mutate({ direction, id }),
    removeSet: (id: string) => {
      const entry = pending.current.get(id);
      if (entry) window.clearTimeout(entry.timer);
      pending.current.delete(id);
      removeSet.mutate(id);
    },
    removeSlot: removeSlot.mutate,
    updateExercise: (id: string, patch: ExercisePatch) => exerciseMutation.mutate({ id, ...patch }),
    updateNote: (id: string, notes: string) => updateNote.mutate({ id, notes }),
    /**
     * Shows the change at once and saves it: ticks and set types right away, dragged values once
     * the drag pauses.
     */
    updateSet: (setId: string, patch: SetPatch) => {
      void queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<WorkoutSessionData>(
        queryKey,
        (session) => session && mapSet(session, setId, (set) => ({ ...set, ...patch })),
      );
      const previous = pending.current.get(setId);
      if (previous) window.clearTimeout(previous.timer);
      const immediate = 'done' in patch || 'type' in patch;
      pending.current.set(setId, {
        patch: { ...previous?.patch, ...patch },
        timer: window.setTimeout(() => flush(setId), immediate ? 0 : SAVE_DELAY_MS),
      });
    },
  };
}
