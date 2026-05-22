import type * as React from 'react'
import styles from '@/styles/app.module.css'

type AuthCardProps = {
  title: string
  description: string
  submitLabel: string
  footer: React.ReactNode
  onSubmit: (formData: FormData) => Promise<void>
  onGoogle?: () => Promise<void>
  busy: boolean
  error: string | null
  fields: React.ReactNode
}

export function AuthCard(props: AuthCardProps) {
  const { busy, description, error, fields, footer, onGoogle, onSubmit, submitLabel, title } = props

  return (
    <section className={styles.authShell}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <p className={styles.eyebrow}>Minimal auth</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <form
          className={styles.authForm}
          onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            const formData = new FormData(event.currentTarget)
            await onSubmit(formData)
          }}
        >
          {fields}
          {error ? <div className={styles.errorBox}>{error}</div> : null}
          <button className={styles.primaryButton} disabled={busy} type='submit'>
            {busy ? 'Working...' : submitLabel}
          </button>
        </form>

        <div className={styles.authDivider}>or</div>

        <button className={styles.secondaryButton} disabled={busy || !onGoogle} onClick={() => void onGoogle?.()} type='button'>
          Continue with Google
        </button>

        <div className={styles.authFooter}>{footer}</div>
      </div>
    </section>
  )
}
