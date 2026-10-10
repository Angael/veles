import { createFileRoute } from '@tanstack/react-router';
import { getListItemsCollection } from '@/pages/todos/listItems.collection';
import { notesQueryOptions } from '@/pages/todos/notes.query';
import { TodosPage } from '@/pages/todos/TodosPage';

export const Route = createFileRoute('/_authenticated/todos')({
  // TanStack DB collections are client-only, so this page renders in the browser.
  ssr: false,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(notesQueryOptions()),
      getListItemsCollection(queryClient).preload(),
    ]),
  component: TodosPage,
  head: () => ({ meta: [{ title: 'Notes' }] }),
  staticData: { navbar: { label: 'Notes' } },
});
