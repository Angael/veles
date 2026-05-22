import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import styles from '@/styles/app.module.css'

const getServerTime = createServerFn({ method: 'GET' }).handler(async () => {
  return {
    renderedAt: new Date().toISOString(),
    mode: 'full-ssr',
  }
})

export const Route = createFileRoute('/demo/start/ssr/full-ssr')({
  loader: () => getServerTime(),
  component: FullSsrPage,
})

function FullSsrPage() {
  const data = Route.useLoaderData() as Awaited<ReturnType<typeof getServerTime>>

  return (
    <article className={styles.demoCard}>
      <div className={styles.demoBody}>
        <span className={styles.demoBadge}>loader + server fn</span>
        <h1>Full SSR route</h1>
        <p>The loader resolves on the server first, then hydrates on the client.</p>
        <div className={styles.demoResult}>
          <strong>Rendered at:</strong> {data.renderedAt}
        </div>
      </div>
    </article>
  )
}
