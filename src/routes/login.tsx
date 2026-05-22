import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AuthCard } from '@/components/AuthCard'
import { signIn } from '@/lib/auth/client'
import styles from '@/styles/app.module.css'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <AuthCard
      busy={busy}
      description='Use the same auth motive as before, but on the new stripped-down stack.'
      error={error}
      fields={
        <>
          <div className={styles.field}>
            <label htmlFor='email'>Email</label>
            <input autoComplete='email' id='email' name='email' required type='email' />
          </div>
          <div className={styles.field}>
            <label htmlFor='password'>Password</label>
            <input autoComplete='current-password' id='password' name='password' required type='password' />
          </div>
        </>
      }
      footer={
        <>
          Need an account? <Link to={'/signup' as never}>Sign up</Link>
        </>
      }
      onGoogle={async () => {
        setBusy(true)
        setError(null)
        await signIn.social({
          provider: 'google',
          callbackURL: '/',
        })
      }}
      onSubmit={async (formData) => {
        setBusy(true)
        setError(null)

        const result = await signIn.email({
          email: String(formData.get('email') || ''),
          password: String(formData.get('password') || ''),
        })

        setBusy(false)

        if (result.error) {
          setError(result.error.message || 'Login failed')
          return
        }

        navigate({ to: '/' as never })
      }}
      submitLabel='Sign in'
      title='Login'
    />
  )
}
