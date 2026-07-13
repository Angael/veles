import { useCallback, useEffect, useMemo, useRef } from 'react';

export type ThrottledCallback<Arguments extends unknown[]> = ((...args: Arguments) => void) & {
  cancel: () => void;
  flush: () => void;
};

/** Calls immediately, then limits further calls to once per wait period. */
export function useThrottle<Arguments extends unknown[]>(
  callback: (...args: Arguments) => void,
  wait: number,
): ThrottledCallback<Arguments> {
  const callbackRef = useRef(callback);
  const argumentsRef = useRef<Arguments>(undefined);
  const lastCallTimeRef = useRef<number | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  callbackRef.current = callback;

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current);
    argumentsRef.current = undefined;
    lastCallTimeRef.current = undefined;
    timeoutRef.current = undefined;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current === undefined || !argumentsRef.current) {
      return;
    }

    const argumentsToUse = argumentsRef.current;
    clearTimeout(timeoutRef.current);
    argumentsRef.current = undefined;
    timeoutRef.current = undefined;
    lastCallTimeRef.current = Date.now();
    callbackRef.current(...argumentsToUse);
  }, []);

  const throttle = useCallback(
    (...args: Arguments) => {
      const lastCallTime = lastCallTimeRef.current;
      const remaining = lastCallTime === undefined ? 0 : wait - (Date.now() - lastCallTime);

      if (remaining <= 0) {
        clearTimeout(timeoutRef.current);
        argumentsRef.current = undefined;
        timeoutRef.current = undefined;
        lastCallTimeRef.current = Date.now();
        callbackRef.current(...args);
        return;
      }

      argumentsRef.current = args;

      if (timeoutRef.current === undefined) {
        timeoutRef.current = setTimeout(flush, remaining);
      }
    },
    [flush, wait],
  );

  useEffect(() => cancel, [cancel]);

  return useMemo(() => Object.assign(throttle, { cancel, flush }), [cancel, flush, throttle]);
}
