import { createIsomorphicFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { useState } from 'react';
import { NAVBAR_ITEMS, type NavbarItem, type NavbarItemKey } from './navbarItems';

/** Pinned links plus the always-present More tab fit six slots at 320px. */
export const MOBILE_NAV_MAX_PINNED = 5;

export type MobileNavPrefs = {
  /** Every navbar key, in the user's order. */
  order: NavbarItemKey[];
  /** Keys shown directly in the dock; the rest stay behind More. */
  pinned: NavbarItemKey[];
};

const COOKIE_NAME = 'veles-mobile-nav';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const PINNED_MARK = '+';
const ALL_KEYS = NAVBAR_ITEMS.map((item) => item.key);

const DEFAULT_PREFS: MobileNavPrefs = {
  order: ALL_KEYS,
  pinned: ALL_KEYS.filter((key) => key !== 'diary'),
};

function isKey(value: string): value is NavbarItemKey {
  return ALL_KEYS.some((key) => key === value);
}

/** Cookie value is the ordered key list, pinned keys prefixed: `+diary,+todos,weight`. */
function serialize({ order, pinned }: MobileNavPrefs) {
  return order.map((key) => (pinned.includes(key) ? PINNED_MARK + key : key)).join(',');
}

/** Parses the cookie and drops unknown keys; items added since the save append unpinned. */
function parse(value: string | undefined): MobileNavPrefs {
  if (!value) {
    return DEFAULT_PREFS;
  }
  const entries = value.split(',');
  const keys = entries.map((entry) => entry.replace(PINNED_MARK, '')).filter(isKey);
  const pinned = entries
    .filter((entry) => entry.startsWith(PINNED_MARK))
    .map((entry) => entry.slice(PINNED_MARK.length))
    .filter(isKey);

  return {
    order: [...new Set([...keys, ...ALL_KEYS])],
    pinned: [...new Set(pinned)].slice(0, MOBILE_NAV_MAX_PINNED),
  };
}

const readCookie = createIsomorphicFn()
  .server(() => getCookie(COOKIE_NAME))
  .client(() =>
    document.cookie
      .split('; ')
      .find((part) => part.startsWith(`${COOKIE_NAME}=`))
      ?.slice(COOKIE_NAME.length + 1),
  );

/** Dock layout stored in a cookie, so the server renders the user's layout on first paint. */
export function useMobileNavPrefs() {
  const [prefs, setPrefs] = useState(() => parse(readCookie()));

  const savePrefs = (next: MobileNavPrefs | null) => {
    setPrefs(next ?? DEFAULT_PREFS);
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    const value = next ? serialize(next) : '';
    const maxAge = next ? COOKIE_MAX_AGE_SECONDS : 0;
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
  };

  return [prefs, savePrefs] as const;
}

export function orderedNavbarItems(prefs: MobileNavPrefs): NavbarItem[] {
  return prefs.order.flatMap((key) => NAVBAR_ITEMS.find((item) => item.key === key) ?? []);
}
