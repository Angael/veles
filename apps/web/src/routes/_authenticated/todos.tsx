import { createFileRoute } from '@tanstack/react-router';
import { notesQueryOptions } from '@/pages/todos/notes.query';
import { TodosPage } from '@/pages/todos/TodosPage';
import { translate } from '@/lib/i18n/getLocale';

export const Route = createFileRoute('/_authenticated/todos')({
  loader: ({ context }) => context.queryClient.ensureQueryData(notesQueryOptions()),
  component: TodosPage,
  head: () => ({ meta: [{ title: translate({ en: 'Notes', pl: 'Notatki' }) }] }),
  staticData: { navbar: { label: { en: 'Notes', pl: 'Notatki' } } },
});
