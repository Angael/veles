import { Link, Outlet, createFileRoute } from '@tanstack/react-router';
import { Card } from '@/components/card/Card';
import css from './demo.module.css';

export const Route = createFileRoute('/demo/start/ssr/')({
  component: SsrLayout,
});

function SsrLayout() {
  return (
    <section className={css.page}>
      <Card as='article'>
        <span className={css.badge}>Route group</span>
        <h1>TanStack Start SSR references</h1>
        <p>These routes are intentionally plain so the framework behavior is easy to inspect.</p>
        <div className={css.buttonRow}>
          <Link className={css.linkButton} to={'/demo/start/ssr/spa-mode' as never}>
            SPA mode
          </Link>
          <Link className={css.linkButton} to={'/demo/start/ssr/full-ssr' as never}>
            Full SSR
          </Link>
          <Link className={css.linkButton} to={'/demo/start/ssr/data-only' as never}>
            Data only
          </Link>
        </div>
      </Card>
      <Outlet />
    </section>
  );
}
