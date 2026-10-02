import { NAVBAR_ITEMS } from '@/components/app/navbar/navbarItems';

/** Matches the `[data-accent]` palettes in theme.css. */
export type PageAccent = (typeof NAVBAR_ITEMS)[number]['key'] | 'home' | 'account';

/** Picks the feature accent for a URL; anything outside a feature keeps the home prism. */
export function getPageAccent(pathname: string): PageAccent {
  const feature = NAVBAR_ITEMS.find((item) =>
    item.matchPrefixes.some((prefix) => pathname.startsWith(prefix)),
  );
  if (feature) return feature.key;
  return pathname.startsWith('/account') ? 'account' : 'home';
}
