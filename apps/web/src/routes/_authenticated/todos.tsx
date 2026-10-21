import { createFileRoute } from '@tanstack/react-router';
import { listItemsCollection } from '@/pages/todos/listItems.collection';
import { notesQueryOptions } from '@/pages/todos/notes.query';
import { TodosPage } from '@/pages/todos/TodosPage';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/todos')({
  // Loaders are bundled with the route tree by default; split this one so the collection config stays lazy.
  codeSplitGroupings: [['loader'], ['component']],
  // On the server, `routerWithDbClient` dehydrates the preloaded rows, so the page renders with items.
  loader: ({ context: { dbClient, queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(notesQueryOptions()),
      dbClient.collection(listItemsCollection).preload(),
    ]),
  component: TodosPage,
  head: () => ({ meta: [{ title: translate({ en: 'Notes', pl: 'Notatki' }) }] }),
  staticData: { navbar: { label: { en: 'Notes', pl: 'Notatki' } } },
});
