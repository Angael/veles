import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { notesQueryOptions } from '@/pages/todos/notes.query';
import { TodosPage } from '@/pages/todos/TodosPage';

export const Route = createFileRoute('/_authenticated/todos')({
  loader: ({ context }) => context.queryClient.ensureQueryData(notesQueryOptions()),
  component: RouteComponent,
  head: () => ({ meta: [{ title: 'Notes' }] }),
  staticData: { navbar: { label: 'Notes', upTo: { to: '/' } } },
});

function RouteComponent() {
  const { data: notes } = useSuspenseQuery(notesQueryOptions());

  return <TodosPage notes={notes} />;
}
