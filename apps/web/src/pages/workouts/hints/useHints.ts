import { useEffect, useState } from 'react';

/**
 * Smooth looping progress 0 → 1 over `ms`, driven by requestAnimationFrame so demo motion is
 * fluid. With reduced motion it parks on `restAt` so the demo still reads as a picture.
 */
export function useTimeline(ms: number, restAt = 0.5) {
  const [progress, setProgress] = useState(restAt);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setProgress(((now - start) % ms) / ms);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ms]);

  return progress;
}

/** True on touch screens, so demos show a finger dot instead of a mouse cursor. */
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => setCoarse(window.matchMedia('(pointer: coarse)').matches), []);
  return coarse;
}

/** 0 before `from`, 1 after `to`, eased in between. */
export function phase(progress: number, from: number, to: number) {
  const linear = Math.min(1, Math.max(0, (progress - from) / (to - from)));
  return linear < 0.5 ? 2 * linear * linear : 1 - (-2 * linear + 2) ** 2 / 2;
}

const STORAGE_KEY = 'veles.workouts.seen-hints';

/** Which first-use tips were dismissed; kept in localStorage so each shows once per device. */
export function useSeenHints() {
  const [seen, setSeen] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      setSeen(Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []);
    } catch {
      setSeen([]);
    }
  }, []);

  function save(next: string[]) {
    setSeen(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return {
    /** Null until read on the client, so the server render never flashes a tip. */
    seen,
    markSeen: (key: string) => save([...(seen ?? []), key]),
    reset: () => save([]),
  };
}
