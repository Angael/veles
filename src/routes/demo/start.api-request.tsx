import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import styles from '@/styles/app.module.css'

export const Route = createFileRoute('/demo/start/api-request')({
  component: ApiRequestPage,
})

function ApiRequestPage() {
  const [result, setResult] = useState<string>('Not fetched yet')

  return (
    <article className={styles.demoCard}>
      <div className={styles.demoBody}>
        <span className={styles.demoBadge}>server route fetch</span>
        <h1>API request route</h1>
        <p>This pairs with a plain TanStack Start API route under `/api/demo/ping`.</p>
        <button
          className={styles.primaryButton}
          onClick={async () => {
            const response = await fetch('/api/demo/ping')
            const data = (await response.json()) as { message: string; timestamp: string }
            setResult(`${data.message} at ${data.timestamp}`)
          }}
          type='button'
        >
          Fetch API route
        </button>
        <div className={styles.demoResult}>{result}</div>
      </div>
    </article>
  )
}
