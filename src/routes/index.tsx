import { Link, createFileRoute } from '@tanstack/react-router';
import styles from '@/styles/app.module.css';

const demoCards = [
  {
    title: 'SPA mode',
    to: '/demo/start/ssr/spa-mode',
    description: 'Route code runs mostly like a client app with Start still handling the shell.',
  },
  {
    title: 'Full SSR',
    to: '/demo/start/ssr/full-ssr',
    description: 'Loader-backed route showing the server-rendered path clearly.',
  },
  {
    title: 'Data only',
    to: '/demo/start/ssr/data-only',
    description: 'Minimal server data delivery without extra visual noise.',
  },
  {
    title: 'Server functions',
    to: '/demo/start/server-funcs',
    description: 'Shows `createServerFn` for per-request server code.',
  },
  {
    title: 'API request',
    to: '/demo/start/api-request',
    description: 'Shows a plain Start API route and client fetch usage.',
  },
  {
    title: 'TanStack Query',
    to: '/demo/tanstack-query',
    description: 'Shows query hydration and route-driven prefetching.',
  },
] as const;

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <section className={styles.hero}>
        <article className={styles.heroCard}>
          <p className={styles.eyebrow}>Stage 3 foundation</p>
          <h1>Fresh TanStack Start, stripped to the useful parts.</h1>
          <p>
            This reset keeps auth, Postgres/Drizzle, and R2-oriented storage config while removing
            the old product, media, food, queue, and styling layers.
          </p>
          <div className={styles.ctaRow}>
            <Link className={styles.primaryButton} to={'/login' as never}>
              Open login
            </Link>
            <Link className={styles.secondaryButton} to={'/signup' as never}>
              Create account
            </Link>
          </div>
        </article>

        <aside className={styles.panel}>
          <h2>What survived the reset</h2>
          <ul>
            <li>Fresh Better Auth with email/password and Google.</li>
            <li>Fresh Drizzle + Postgres foundation.</li>
            <li>R2/S3 env scaffolding and path-to-public-url helper.</li>
            <li>Base UI plus CSS modules instead of Tailwind and shadcn.</li>
          </ul>
        </aside>
      </section>

      <section className={styles.grid}>
        {demoCards.map((card) => (
          <article className={styles.demoCard} key={card.to}>
            <div className={styles.demoMeta}>Reference route</div>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <Link className={styles.linkButton} to={card.to as never}>
              View route
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
