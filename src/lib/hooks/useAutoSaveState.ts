import { useDebouncer } from '@tanstack/react-pacer';
import { useEffect, useRef, useState, type DependencyList, type SetStateAction } from 'react';
import { createSequentialTaskQueue } from '@/lib/async/createSequentialTaskQueue';

type UseAutoSaveStateOptions = {
  debounceMs: number;
  deps: DependencyList;
};

/** Keeps an editable local value in sync with source data and saves edits after a short pause. */
export function useAutoSaveState<State>(
  initialState: State,
  onDebouncedSave: (state: State) => unknown,
  options: UseAutoSaveStateOptions = { debounceMs: 300, deps: [initialState] },
) {
  const [state, setState] = useState(initialState);
  const latestStateRef = useRef(state);
  const saveCallbackRef = useRef(onDebouncedSave);
  saveCallbackRef.current = onDebouncedSave;
  const saveQueueRef = useRef<ReturnType<typeof createSequentialTaskQueue<State>> | null>(null);

  if (saveQueueRef.current === null) {
    saveQueueRef.current = createSequentialTaskQueue((stateToSave: State) =>
      saveCallbackRef.current(stateToSave),
    );
  }

  const saveDebouncer = useDebouncer(
    (stateToSave: State) => {
      void saveQueueRef.current?.(stateToSave).catch(() => undefined);
    },
    {
      onUnmount: (debouncer) => debouncer.flush(),
      wait: options.debounceMs,
    },
  );

  const setAutoSaveState = (nextState: SetStateAction<State>) => {
    const resolvedState =
      typeof nextState === 'function'
        ? (nextState as (previousState: State) => State)(latestStateRef.current)
        : nextState;

    latestStateRef.current = resolvedState;
    setState(resolvedState);
    saveDebouncer.maybeExecute(resolvedState);
  };

  useEffect(() => {
    const flushSaveWhenHidden = () => {
      if (document.visibilityState === 'hidden') {
        saveDebouncer.flush();
      }
    };

    document.addEventListener('visibilitychange', flushSaveWhenHidden);
    return () => document.removeEventListener('visibilitychange', flushSaveWhenHidden);
  }, [saveDebouncer]);

  useEffect(() => {
    latestStateRef.current = initialState;
    setState(initialState);
    // The caller controls synchronization with the values used to identify source data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options.deps);

  return [state, setAutoSaveState] as const;
}
