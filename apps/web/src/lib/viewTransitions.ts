// view-transitions: removable module; see also styles/view-transitions.css and grep `view-transitions:`.
import type { ParsedLocation } from '@tanstack/react-router';

const BACK_REQUEST_TTL_MS = 1000;
let backRequestedAt = Number.NEGATIVE_INFINITY;
let popPending = false;

if (typeof window !== 'undefined') {
  // Registered after the router's own listener, but runs before its async blocker check resolves.
  window.addEventListener('popstate', () => {
    popPending = true;
  });
}

/** Marks the next history pop as ours so it animates; system back gestures animate themselves. */
export function markBackTransition() {
  backRequestedAt = performance.now();
}

/** Enables router view transitions only where typed transitions work and motion is welcome. */
export function routeViewTransition() {
  if (typeof window === 'undefined') return undefined;
  if (!CSS.supports('selector(:active-view-transition-type(a))')) return undefined;
  return { types: routeViewTransitionTypes };
}

/**
 * Picks a direction: forward for pushes, back for our back button and post-save replaces.
 * Browser/system back-forward and same-path changes (week switching) skip the transition.
 */
function routeViewTransitionTypes({
  fromLocation,
  pathChanged,
  toLocation,
}: {
  fromLocation?: ParsedLocation;
  pathChanged: boolean;
  toLocation: ParsedLocation;
}): string[] | false {
  const isOurBack = performance.now() - backRequestedAt < BACK_REQUEST_TTL_MS;
  const isPop = popPending;
  backRequestedAt = Number.NEGATIVE_INFINITY;
  popPending = false;

  if (!pathChanged || !fromLocation) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (isOurBack) return ['nav-back'];
  if (isPop) return false;
  return toLocation.state.__TSR_index > fromLocation.state.__TSR_index
    ? ['nav-forward']
    : ['nav-back'];
}
