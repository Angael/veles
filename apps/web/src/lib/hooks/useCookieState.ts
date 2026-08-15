import { useRef, useState, type SetStateAction } from 'react';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Keeps string state synchronized with a durable, browser-readable cookie. */
export function useCookieState<State extends string>(cookieName: string, initialState: State) {
  const [state, setState] = useState(initialState);
  const latestStateRef = useRef(state);

  const setCookieState = (nextState: SetStateAction<State>) => {
    const resolvedState =
      typeof nextState === 'function'
        ? (nextState as (previousState: State) => State)(latestStateRef.current)
        : nextState;

    latestStateRef.current = resolvedState;
    setState(resolvedState);

    const secureAttribute = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${cookieName}=${encodeURIComponent(resolvedState)}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureAttribute}`;
  };

  return [state, setCookieState] as const;
}
