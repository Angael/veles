import { useEffect, useRef, useState } from 'react';

export type RestTimer = {
  /** Seconds left; negative once the rest is over, so "overtime" can show. */
  remaining: number;
  total: number;
  running: boolean;
  label: string;
  start: (seconds: number, label: string) => void;
  adjust: (deltaSeconds: number) => void;
  skip: () => void;
};

type TimerState = { endsAt: number; total: number; label: string } | null;

const STORAGE_KEY = 'veles.workouts-demo.rest';

function readStored(): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TimerState) : null;
  } catch {
    return null;
  }
}

/**
 * Rest countdown stored as an end timestamp, not a ticking number, so it survives reloads,
 * background tabs and phone sleep. Vibrates once when the rest ends (Android only; iOS ignores it).
 */
export function useRestTimer(): RestTimer {
  const [state, setState] = useState<TimerState>(null);
  const [now, setNow] = useState(() => Date.now());
  const buzzedFor = useRef<number | null>(null);

  useEffect(() => setState(readStored()), []);

  useEffect(() => {
    if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    else localStorage.removeItem(STORAGE_KEY);
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [state]);

  const remaining = state ? (state.endsAt - now) / 1000 : 0;

  useEffect(() => {
    if (state && remaining <= 0 && buzzedFor.current !== state.endsAt) {
      buzzedFor.current = state.endsAt;
      if ('vibrate' in navigator) navigator.vibrate([180, 80, 180]);
    }
  }, [remaining, state]);

  return {
    adjust: (delta) =>
      setState((current) =>
        current
          ? {
              ...current,
              endsAt: current.endsAt + delta * 1000,
              total: Math.max(1, current.total + delta),
            }
          : current,
      ),
    label: state?.label ?? '',
    remaining,
    running: state !== null,
    skip: () => setState(null),
    start: (seconds, label) => {
      setNow(Date.now());
      setState({ endsAt: Date.now() + seconds * 1000, label, total: seconds });
    },
    total: state?.total ?? 0,
  };
}
