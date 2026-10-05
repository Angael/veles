import { useEffect, useState } from 'react';

/**
 * Steps through `frames` every `ms`, forever. With reduced motion it parks on `restFrame` so the
 * demo still reads as a picture.
 */
export function useLoop(frames: number, ms: number, restFrame = frames - 1) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFrame(restFrame);
      return;
    }
    const interval = setInterval(() => setFrame((current) => (current + 1) % frames), ms);
    return () => clearInterval(interval);
  }, [frames, ms, restFrame]);

  return frame;
}

const STORAGE_KEY = 'veles.workouts-demo.seen-hints';

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
