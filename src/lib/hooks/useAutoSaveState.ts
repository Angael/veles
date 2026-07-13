import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DependencyList,
  type SetStateAction,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';

type UseAutoSaveStateOptions = {
  debounceMs: number;
  deps: DependencyList;
};

/** Keeps an editable local value in sync with source data and saves edits after a short pause. */
export function useAutoSaveState<State>(
  initialState: State,
  onDebouncedSave: (state: State) => Promise<void>,
  options: UseAutoSaveStateOptions,
) {
  const [state, setState] = useState(initialState);
  const latestStateRef = useRef(state);
  const onDebouncedSaveRef = useRef(onDebouncedSave);
  const saveRequestRef = useRef(Promise.resolve());
  onDebouncedSaveRef.current = onDebouncedSave;

  const save = useCallback((stateToSave: State) => {
    saveRequestRef.current = saveRequestRef.current
      .then(() => onDebouncedSaveRef.current(stateToSave))
      .catch(() => undefined);
  }, []);

  const debouncedSave = useDebouncedCallback(save, options.debounceMs, { flushOnExit: true });

  const setAutoSaveState = useCallback(
    (nextState: SetStateAction<State>) => {
      const resolvedState =
        typeof nextState === 'function'
          ? (nextState as (previousState: State) => State)(latestStateRef.current)
          : nextState;

      latestStateRef.current = resolvedState;
      setState(resolvedState);
      debouncedSave(resolvedState);
    },
    [debouncedSave],
  );

  useEffect(() => {
    latestStateRef.current = initialState;
    setState(initialState);
    // The caller controls synchronization with the values used to identify source data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, options.deps);

  return [state, setAutoSaveState] as const;
}
