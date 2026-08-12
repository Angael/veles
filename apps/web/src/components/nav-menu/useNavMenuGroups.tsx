import type { ReactNode } from 'react';

export interface NavMenuGroup {
  key: string;
  label: ReactNode;
  matchPrefixes: string[];
  items: NavMenuItem[];
}

export interface NavMenuItem {
  key: string;
  label: ReactNode;
  description: string;
  link?: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
}

export const DESKTOP_NAV_MENU_GROUPS: NavMenuGroup[] = [
  {
    key: 'trackers',
    label: 'Trackers',
    matchPrefixes: ['/weight', '/recipes', '/diary', '/todos'],
    items: [
      {
        key: 'weight',
        link: '/weight',
        label: 'Weight',
        description: 'Log body weight and review progress over time.',
      },
      {
        key: 'recipes',
        link: '/recipes',
        label: 'Recipes',
        description: 'Recipe notes and cooking references.',
      },
      {
        key: 'diary',
        link: '/diary',
        label: 'Diary',
        description: 'Private personal entries and imported journals.',
      },
      {
        key: 'todos',
        link: '/todos',
        label: 'Todos',
        description: 'Shared checklists for shopping and life goals.',
      },
    ],
  },
];

export const MOBILE_NAV_ITEMS = [
  {
    key: 'diary',
    label: 'Diary',
    link: '/diary',
    matchPrefixes: ['/diary'],
  },
  {
    key: 'todos',
    label: 'Todos',
    link: '/todos',
    matchPrefixes: ['/todos'],
  },
  {
    key: 'recipes',
    label: 'Recipes',
    link: '/recipes',
    matchPrefixes: ['/recipes'],
  },
  {
    key: 'weight',
    label: 'Weight tracker',
    link: '/weight',
    matchPrefixes: ['/weight'],
  },
  {
    key: 'calories',
    label: 'Calorie tracker',
    link: '/calories',
    matchPrefixes: ['/calories'],
  },
] as const;
