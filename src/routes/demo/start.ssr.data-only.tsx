import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import css from './demo.module.css';

const getFacts = createServerFn({ method: 'GET' }).handler(async () => {
  return [
    'Reads server data without extra app logic.',
    'Good for seeing what Start serializes into the route payload.',
    'Intentionally plain for future reference.',
  ];
});

export const Route = createFileRoute('/demo/start/ssr/data-only')({
  loader: () => getFacts(),
  component: DataOnlyPage,
});

function DataOnlyPage() {
  const facts = Route.useLoaderData() as Awaited<ReturnType<typeof getFacts>>;

  return (
    <article className={css.card}>
      <div className={css.body}>
        <span className={css.badge}>server data only</span>
        <h1>Data-only route</h1>
        <ul>
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
