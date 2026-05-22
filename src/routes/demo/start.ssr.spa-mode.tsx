import { createFileRoute } from '@tanstack/react-router';
import styles from '@/styles/app.module.css';

export const Route = createFileRoute('/demo/start/ssr/spa-mode')({
  component: SpaModePage,
  ssr: false,
});

function SpaModePage() {
  return (
    <article className={styles.demoCard}>
      <div className={styles.demoBody}>
        <span className={styles.demoBadge}>`ssr: false`</span>
        <h1>SPA mode route</h1>
        <p>This file shows the simplest TanStack Start opt-out for route-level SSR.</p>
        <pre
          className={styles.demoResult}
        >{`export const Route = createFileRoute('/demo/start/ssr/spa-mode')({\n  component: SpaModePage,\n  ssr: false,\n})`}</pre>
      </div>
    </article>
  );
}
