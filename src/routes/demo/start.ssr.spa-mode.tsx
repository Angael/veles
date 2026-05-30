import { createFileRoute } from '@tanstack/react-router';
import { Card } from '@/components/Card';
import css from './demo.module.css';

export const Route = createFileRoute('/demo/start/ssr/spa-mode')({
  component: SpaModePage,
  ssr: false,
});

function SpaModePage() {
  return (
    <Card as='article'>
      <div className={css.body}>
        <span className={css.badge}>`ssr: false`</span>
        <h1>SPA mode route</h1>
        <p>This file shows the simplest TanStack Start opt-out for route-level SSR.</p>
        <pre
          className={css.result}
        >{`export const Route = createFileRoute('/demo/start/ssr/spa-mode')({
  component: SpaModePage,
  ssr: false,
})`}</pre>
      </div>
    </Card>
  );
}
