import { useEffect, useRef, useState, type SetStateAction } from 'react';

/** Keeps local React state persisted in localStorage while remaining safe during SSR. */
export function useLocalStorageState<State>(key: string, initialState: State) {
  const [state, setState] = useState(initialState);
  const latestStateRef = useRef(state);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(key);

      if (storedState !== null) {
        const parsedState: State = JSON.parse(storedState);
        latestStateRef.current = parsedState;
        setState(parsedState);
      }
    } catch {
      // Storage can be unavailable or contain malformed data; retain the supplied default.
    }
  }, [key]);

  const setLocalStorageState = (nextState: SetStateAction<State>) => {
    const resolvedState =
      typeof nextState === 'function'
        ? (nextState as (previousState: State) => State)(latestStateRef.current)
        : nextState;

    latestStateRef.current = resolvedState;
    setState(resolvedState);

    try {
      localStorage.setItem(key, JSON.stringify(resolvedState));
    } catch {
      // State should continue working when persistence is unavailable.
    }
  };

  return [state, setLocalStorageState] as const;
}
