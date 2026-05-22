import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { AuthCard } from '@/components/AuthCard'
import { signIn, signUp } from '@/lib/auth/client'
import styles from '@/styles/app.module.css'

export const Route = createFileRoute('/signup')({
  component: SignupPage,
})

function SignupPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <AuthCard
      busy={busy}
      description='Fresh install, same login options: email/password and Google.'
      error={error}
      fields={
        <>
          <div className={styles.field}>
            <label htmlFor='name'>Name</label>
            <input autoComplete='name' id='name' name='name' required type='text' />
          </div>
          <div className={styles.field}>
            <label htmlFor='email'>Email</label>
            <input autoComplete='email' id='email' name='email' required type='email' />
          </div>
          <div className={styles.field}>
            <label htmlFor='password'>Password</label>
            <input autoComplete='new-password' id='password' minLength={8} name='password' required type='password' />
          </div>
        </>
      }
      footer={
        <>
          Already have an account? <Link to={'/login' as never}>Log in</Link>
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

        const result = await signUp.email({
          name: String(formData.get('name') || ''),
          email: String(formData.get('email') || ''),
          password: String(formData.get('password') || ''),
        })

        setBusy(false)

        if (result.error) {
          setError(result.error.message || 'Signup failed')
          return
        }

        navigate({ to: '/' as never })
      }}
      submitLabel='Create account'
      title='Sign up'
    />
  )
}
