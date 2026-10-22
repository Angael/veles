import { useRouter, type RegisteredRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { normalizeCalorieDate } from './calorieHelpers';
import { scrollRestorationKey } from '@/lib/routing/scrollRestorationKey';

/** The diary entry a calorie flow was opened from, and the day it showed. */
let origin: { date: string; key: string } | undefined;
const trackedRouters = new WeakSet<RegisteredRouter>();

/**
 * Remembers which diary entry opened a calorie flow (add, scan, quick add, edit log, goals).
 * Saved returns use `replace`, which makes a new history entry with no saved scroll, so they
 * borrow the opening entry's scroll key instead. Leaving the calorie routes forgets it.
 */
export function useCaloriesReturnScrollOrigin() {
  const router = useRouter();

  useEffect(() => {
    if (trackedRouters.has(router)) return;
    trackedRouters.add(router);
    // Not unsubscribed on unmount: the flow pages run after the diary unmounts.
    router.subscribe('onBeforeLoad', ({ fromLocation, toLocation }) => {
      if (fromLocation?.pathname === '/calories' && toLocation.pathname.startsWith('/calories/')) {
        const search: Record<string, unknown> = fromLocation.search;
        origin = {
          date: normalizeCalorieDate(typeof search.date === 'string' ? search.date : undefined),
          key: scrollRestorationKey(fromLocation),
        };
      } else if (!toLocation.pathname.startsWith('/calories')) {
        origin = undefined;
      }
    });
  }, [router]);
}

/** History state for a saved return to `date`; restores the diary scroll when the flow began there. */
export function caloriesReturnState(date: string) {
  return origin?.date === date ? { restoreScrollKey: origin.key } : undefined;
}
