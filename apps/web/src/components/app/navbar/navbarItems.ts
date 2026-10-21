import {
  ActivityIcon,
  CookingPotIcon,
  DumbbellIcon,
  FeatherIcon,
  FlameIcon,
  NotebookPenIcon,
  ScaleIcon,
  StickyNoteIcon,
  UtensilsIcon,
} from 'lucide-react';

const diary = {
  key: 'diary',
  label: { en: 'Diary', pl: 'Dziennik' },
  link: '/diary',
  matchPrefixes: ['/diary'],
  icon: NotebookPenIcon,
} as const;

const todos = {
  key: 'todos',
  label: { en: 'Notes', pl: 'Notatki' },
  link: '/todos',
  matchPrefixes: ['/todos'],
  icon: StickyNoteIcon,
} as const;

const recipes = {
  key: 'recipes',
  label: { en: 'Recipes', pl: 'Przepisy' },
  link: '/recipes',
  matchPrefixes: ['/recipes'],
  icon: CookingPotIcon,
} as const;

const weight = {
  key: 'weight',
  label: { en: 'Weight', pl: 'Waga' },
  link: '/weight',
  matchPrefixes: ['/weight'],
  icon: ScaleIcon,
} as const;

const workouts = {
  key: 'workouts',
  label: { en: 'Workouts', pl: 'Treningi' },
  link: '/workouts',
  matchPrefixes: ['/workouts'],
  icon: DumbbellIcon,
} as const;

const calories = {
  key: 'calories',
  label: { en: 'Calories', pl: 'Kalorie' },
  link: '/calories',
  matchPrefixes: ['/calories'],
  icon: FlameIcon,
} as const;

/** Flat destination order used by the desktop header. */
export const NAVBAR_ITEMS = [diary, todos, recipes, weight, workouts, calories] as const;

/** Phone dock grouping: each section reveals two destination links. */
export const NAVBAR_SECTIONS = [
  {
    key: 'journal',
    label: { en: 'Journal', pl: 'Zapiski' },
    icon: FeatherIcon,
    items: [diary, todos],
  },
  {
    key: 'food',
    label: { en: 'Food', pl: 'Jedzenie' },
    icon: UtensilsIcon,
    items: [calories, recipes],
  },
  {
    key: 'activity',
    label: { en: 'Activity', pl: 'Aktywność' },
    icon: ActivityIcon,
    items: [workouts, weight],
  },
] as const;

export type NavbarItem = (typeof NAVBAR_ITEMS)[number];
export type NavbarSection = (typeof NAVBAR_SECTIONS)[number];

export function isNavbarItemActive(item: NavbarItem, pathname: string) {
  return item.matchPrefixes.some((prefix) => pathname.startsWith(prefix));
}
