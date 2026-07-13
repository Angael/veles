import { useEffect, useState } from 'react';
import { useThrottle } from './useThrottle';

type ThrottledValueControls = {
  cancel: () => void;
  flush: () => void;
};

/** Returns a value immediately, then limits subsequent updates to the wait period. */
export function useThrottledValue<Value>(
  value: Value,
  wait: number,
): [Value, ThrottledValueControls] {
  const [throttledValue, setThrottledValue] = useState(value);
  const updateValue = useThrottle(setThrottledValue, wait);

  useEffect(() => {
    updateValue(value);
  }, [updateValue, value]);

  return [throttledValue, { cancel: updateValue.cancel, flush: updateValue.flush }];
}
