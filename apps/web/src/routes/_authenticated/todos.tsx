import { createFileRoute } from '@tanstack/react-router';
import { notesQueryOptions } from '@/pages/todos/notes.query';
import { TodosPage } from '@/pages/todos/TodosPage';

export const Route = createFileRoute('/_authenticated/todos')({
  loader: ({ context }) => context.queryClient.ensureQueryData(notesQueryOptions()),
  component: TodosPage,
  head: () => ({ meta: [{ title: 'Notes' }] }),
  staticData: { navbar: { label: 'Notes', upTo: { to: '/' } } },
});
