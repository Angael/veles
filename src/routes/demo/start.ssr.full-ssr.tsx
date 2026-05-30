import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Card } from '@/components/Card';
import css from './demo.module.css';

const getServerTime = createServerFn({ method: 'GET' }).handler(async () => {
  return {
    renderedAt: new Date().toISOString(),
    mode: 'full-ssr',
  };
});

export const Route = createFileRoute('/demo/start/ssr/full-ssr')({
  loader: () => getServerTime(),
  component: FullSsrPage,
});

function FullSsrPage() {
  const data = Route.useLoaderData() as Awaited<ReturnType<typeof getServerTime>>;

  return (
    <Card as='article'>
      <div className={css.body}>
        <span className={css.badge}>loader + server fn</span>
        <h1>Full SSR route</h1>
        <p>The loader resolves on the server first, then hydrates on the client.</p>
        <div className={css.result}>
          <strong>Rendered at:</strong> {data.renderedAt}
        </div>
      </div>
    </Card>
  );
}
