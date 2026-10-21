import { useSyncExternalStore } from 'react';
import { NAVBAR_ITEMS, type NavbarItem, type NavbarItemKey } from './navbarItems';

/** Pinned links plus the always-present More tab fit six slots at 320px. */
export const MOBILE_NAV_MAX_PINNED = 5;

export type MobileNavPrefs = {
  /** Every navbar key, in the user's order. */
  order: NavbarItemKey[];
  /** Keys shown directly in the dock; the rest stay behind More. */
  pinned: NavbarItemKey[];
};

const STORAGE_KEY = 'veles.mobileNav.v1';
const ALL_KEYS = NAVBAR_ITEMS.map((item) => item.key);

export const DEFAULT_MOBILE_NAV_PREFS: MobileNavPrefs = {
  order: ALL_KEYS,
  pinned: ['diary', 'todos', 'recipes', 'workouts', 'calories'],
};

function isKey(value: unknown): value is NavbarItemKey {
  return ALL_KEYS.some((key) => key === value);
}

/**
 * Reads stored prefs and repairs them against the current item list: unknown keys drop, new
 * items append to the order, and the pin count respects the max. Bad JSON falls back to defaults.
 */
function parsePrefs(raw: string | null): MobileNavPrefs {
  if (!raw) {
    return DEFAULT_MOBILE_NAV_PREFS;
  }
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) {
      return DEFAULT_MOBILE_NAV_PREFS;
    }
    const order = 'order' in value && Array.isArray(value.order) ? value.order.filter(isKey) : [];
    const pinned =
      'pinned' in value && Array.isArray(value.pinned) ? value.pinned.filter(isKey) : [];
    return {
      order: [...new Set([...order, ...ALL_KEYS])],
      pinned: [...new Set(pinned)].slice(0, MOBILE_NAV_MAX_PINNED),
    };
  } catch {
    return DEFAULT_MOBILE_NAV_PREFS;
  }
}

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedPrefs = DEFAULT_MOBILE_NAV_PREFS;

function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot() {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedPrefs = parsePrefs(raw);
  }
  return cachedPrefs;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function saveMobileNavPrefs(prefs: MobileNavPrefs | null) {
  try {
    if (prefs) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Private mode or full storage: keep the current layout.
  }
  for (const listener of listeners) {
    listener();
  }
}

/** Device-local dock layout. The server render uses the defaults, then the stored value applies. */
export function useMobileNavPrefs() {
  return useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_MOBILE_NAV_PREFS);
}

export function orderedNavbarItems(prefs: MobileNavPrefs): NavbarItem[] {
  return prefs.order.flatMap((key) => NAVBAR_ITEMS.find((item) => item.key === key) ?? []);
}
