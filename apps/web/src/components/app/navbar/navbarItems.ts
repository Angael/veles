import {
  BookOpenIcon,
  DumbbellIcon,
  FlameIcon,
  ListTodoIcon,
  NotebookPenIcon,
  ScaleIcon,
} from 'lucide-react';

export const NAVBAR_ITEMS = [
  {
    key: 'diary',
    label: { en: 'Diary', pl: 'Dziennik' },
    link: '/diary',
    matchPrefixes: ['/diary'],
    icon: NotebookPenIcon,
  },
  {
    key: 'todos',
    label: { en: 'Notes', pl: 'Notatki' },
    link: '/todos',
    matchPrefixes: ['/todos'],
    icon: ListTodoIcon,
  },
  {
    key: 'recipes',
    label: { en: 'Recipes', pl: 'Przepisy' },
    link: '/recipes',
    matchPrefixes: ['/recipes'],
    icon: BookOpenIcon,
  },
  {
    key: 'weight',
    label: { en: 'Weight', pl: 'Waga' },
    link: '/weight',
    matchPrefixes: ['/weight'],
    icon: ScaleIcon,
  },
  {
    key: 'workouts',
    label: { en: 'Workouts', pl: 'Treningi' },
    link: '/workouts',
    matchPrefixes: ['/workouts'],
    icon: DumbbellIcon,
  },
  {
    key: 'calories',
    label: { en: 'Calories', pl: 'Kalorie' },
    link: '/calories',
    matchPrefixes: ['/calories'],
    icon: FlameIcon,
  },
] as const;
