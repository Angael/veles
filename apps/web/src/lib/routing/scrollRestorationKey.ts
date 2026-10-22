import type { ParsedLocation } from '@tanstack/react-router';

/**
 * Router scroll restoration key. A navigation can set `restoreScrollKey` in its history state to
 * share an earlier entry's saved scroll, e.g. a `replace` back to a list after a save. Otherwise
 * it matches the router default: the entry key, or the href before history state exists.
 */
export function scrollRestorationKey(location: ParsedLocation) {
  const { state } = location;
  return state.restoreScrollKey || state.__TSR_key || location.href;
}

declare module '@tanstack/react-router' {
  interface HistoryState {
    /** Scroll restoration key of an earlier entry whose saved scroll this entry reuses. */
    restoreScrollKey?: string;
  }
}
