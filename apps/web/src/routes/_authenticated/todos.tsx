import { createFileRoute } from '@tanstack/react-router';
import { TodosPage } from '@/pages/todos/TodosPage';

export const Route = createFileRoute('/_authenticated/todos')({
  component: TodosPage,
  head: () => ({ meta: [{ title: 'Todos' }] }),
  staticData: { navbar: { label: 'Todos', upTo: { to: '/' } } },
});
