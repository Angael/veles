import {
  CookingPotIcon,
  DumbbellIcon,
  FlameIcon,
  NotebookPenIcon,
  ScaleIcon,
  StickyNoteIcon,
} from 'lucide-react';

/**
 * Primary destinations shared by the desktop header and the phone dock. Diary, Notes, and Recipes
 * need clearly different silhouettes (notebook, square note, pot): the phone labels are small.
 */

export const NAVBAR_ITEMS = [
  {
    key: 'diary',
    label: { en: 'Diary', pl: 'Dziennik' },
    description: { en: 'Private, encrypted journal', pl: 'Prywatny, szyfrowany dziennik' },
    link: '/diary',
    matchPrefixes: ['/diary'],
    icon: NotebookPenIcon,
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
    icon: CookingPotIcon,
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
export type NavbarItemKey = NavbarItem['key'];

/** Segment-aware match, the same rule TanStack Router uses for a link's `aria-current`. */
export function isNavbarItemActive(item: NavbarItem, pathname: string) {
  return item.matchPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
