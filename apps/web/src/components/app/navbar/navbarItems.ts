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
    label: 'Diary',
    link: '/diary',
    matchPrefixes: ['/diary'],
    icon: NotebookPenIcon,
  },
  {
    key: 'todos',
    label: 'Todos',
    link: '/todos',
    matchPrefixes: ['/todos'],
    icon: ListTodoIcon,
  },
  {
    key: 'recipes',
    label: 'Recipes',
    link: '/recipes',
    matchPrefixes: ['/recipes'],
    icon: BookOpenIcon,
  },
  {
    key: 'weight',
    label: 'Weight',
    link: '/weight',
    matchPrefixes: ['/weight'],
    icon: ScaleIcon,
  },
  {
    key: 'workouts',
    label: 'Workouts',
    link: '/workouts',
    matchPrefixes: ['/workouts'],
    icon: DumbbellIcon,
  },
  {
    key: 'calories',
    label: 'Calories',
    link: '/calories',
    matchPrefixes: ['/calories'],
    icon: FlameIcon,
  },
] as const;
