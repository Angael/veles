import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import styles from '@/styles/app.module.css'

const explainServerFn = createServerFn({ method: 'GET' }).handler(async () => {
  return {
    runtime: 'server',
    timestamp: new Date().toISOString(),
  }
})

export const Route = createFileRoute('/demo/start/server-funcs')({
  component: ServerFunctionsPage,
})

function ServerFunctionsPage() {
  const [result, setResult] = useState<string>('Not called yet')

  return (
    <article className={styles.demoCard}>
      <div className={styles.demoBody}>
        <span className={styles.demoBadge}>createServerFn</span>
        <h1>Server function route</h1>
        <p>Click the button to call a server-only function from the client.</p>
        <button
          className={styles.primaryButton}
          onClick={async () => {
            const data = await explainServerFn()
            setResult(`${data.runtime} at ${data.timestamp}`)
          }}
          type='button'
        >
          Call server function
        </button>
        <div className={styles.demoResult}>{result}</div>
      </div>
    </article>
  )
}
