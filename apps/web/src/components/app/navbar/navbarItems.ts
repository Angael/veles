import {
  BookHeartIcon,
  ChefHatIcon,
  DumbbellIcon,
  FlameIcon,
  ScaleIcon,
  StickyNoteIcon,
} from 'lucide-react';

export const NAVBAR_ITEMS = [
  {
    key: 'diary',
    label: { en: 'Diary', pl: 'Dziennik' },
    description: { en: 'Private, encrypted journal', pl: 'Prywatny, szyfrowany dziennik' },
    link: '/diary',
    matchPrefixes: ['/diary'],
    icon: BookHeartIcon,
  },
  {
    key: 'todos',
    label: { en: 'Notes', pl: 'Notatki' },
    description: { en: 'Lists and quick notes', pl: 'Listy i szybkie notatki' },
    link: '/todos',
    matchPrefixes: ['/todos'],
    icon: StickyNoteIcon,
  },
  {
    key: 'recipes',
    label: { en: 'Recipes', pl: 'Przepisy' },
    description: { en: 'Saved meals and ingredients', pl: 'Zapisane dania i składniki' },
    link: '/recipes',
    matchPrefixes: ['/recipes'],
    icon: ChefHatIcon,
  },
  {
    key: 'weight',
    label: { en: 'Weight', pl: 'Waga' },
    description: { en: 'Weigh-ins and trend', pl: 'Pomiary i trend wagi' },
    link: '/weight',
    matchPrefixes: ['/weight'],
    icon: ScaleIcon,
  },
  {
    key: 'workouts',
    label: { en: 'Workouts', pl: 'Treningi' },
    description: { en: 'Training sessions and sets', pl: 'Sesje treningowe i serie' },
    link: '/workouts',
    matchPrefixes: ['/workouts'],
    icon: DumbbellIcon,
  },
  {
    key: 'calories',
    label: { en: 'Calories', pl: 'Kalorie' },
    description: { en: 'Food log and daily goal', pl: 'Posiłki i dzienny cel' },
    link: '/calories',
    matchPrefixes: ['/calories'],
    icon: FlameIcon,
  },
] as const;

export type NavbarItem = (typeof NAVBAR_ITEMS)[number];

/** Direct phone dock tabs, in order; everything else lives behind More. #251 can make this a user preference. */
export const MOBILE_DOCK_ITEM_KEYS: readonly NavbarItem['key'][] = ['diary', 'todos', 'calories'];

export const MOBILE_DOCK_ITEMS = MOBILE_DOCK_ITEM_KEYS.flatMap(
  (key) => NAVBAR_ITEMS.find((item) => item.key === key) ?? [],
);

/** Segment-aware match, the same rule TanStack Router uses for a link's `aria-current`. */
export function isNavbarItemActive(item: NavbarItem, pathname: string) {
  return item.matchPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
