import { useState } from 'react';

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Keeps string state synchronized with a durable, browser-readable cookie. */
export function useCookieState<State extends string>(cookieName: string, initialState: State) {
  const [state, setState] = useState(initialState);

  const setCookieState = (nextState: State) => {
    setState(nextState);

    const secureAttribute = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${cookieName}=${encodeURIComponent(nextState)}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secureAttribute}`;
  };

  return [state, setCookieState] as const;
}
