import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import styles from '@/styles/app.module.css'

export const Route = createFileRoute('/demo/start/ssr/')({
  component: SsrLayout,
})

function SsrLayout() {
  return (
    <section className={styles.demoPage}>
      <article className={styles.demoCard}>
        <span className={styles.demoBadge}>Route group</span>
        <h1>TanStack Start SSR references</h1>
        <p>These routes are intentionally plain so the framework behavior is easy to inspect.</p>
        <div className={styles.ctaRow}>
          <Link className={styles.linkButton} to={'/demo/start/ssr/spa-mode' as never}>
            SPA mode
          </Link>
          <Link className={styles.linkButton} to={'/demo/start/ssr/full-ssr' as never}>
            Full SSR
          </Link>
          <Link className={styles.linkButton} to={'/demo/start/ssr/data-only' as never}>
            Data only
          </Link>
        </div>
      </article>
      <Outlet />
    </section>
  )
}
