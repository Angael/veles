import { queryOptions, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import css from './demo.module.css';

const getTodos = createServerFn({ method: 'GET' }).handler(async () => {
  return [
    { id: '1', text: 'Prefetch with route loader' },
    { id: '2', text: 'Read with useQuery in the component' },
    { id: '3', text: 'Keep the example short and inspectable' },
  ];
});

const todosQueryOptions = queryOptions({
  queryKey: ['demo-todos'],
  queryFn: () => getTodos(),
});

export const Route = createFileRoute('/demo/tanstack-query')({
  loader: ({ context }) =>
    (
      context as { queryClient: import('@tanstack/react-query').QueryClient }
    ).queryClient.ensureQueryData(todosQueryOptions),
  component: TanStackQueryPage,
});

function TanStackQueryPage() {
  const { data } = useQuery(todosQueryOptions);

  return (
    <article className={css.card}>
      <div className={css.body}>
        <span className={css.badge}>loader + query hydration</span>
        <h1>TanStack Query route</h1>
        <ul>
          {data?.map((todo) => (
            <li key={todo.id}>{todo.text}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
