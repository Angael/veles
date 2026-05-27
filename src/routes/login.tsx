import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { AuthCard } from '@/components/AuthCard';
import { signIn } from '@/lib/auth/client';
import css from './auth.module.css';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  pendingComponent: AuthPendingPage,
  ssr: false,
});

function AuthPendingPage() {
  return (
    <AuthCard
      busy={true}
      description='Loading sign-in form.'
      error={null}
      fields={
        <>
          <div className={css.field}>
            <label htmlFor='pending-email'>Email</label>
            <input autoComplete='email' disabled id='pending-email' type='email' />
          </div>
          <div className={css.field}>
            <label htmlFor='pending-password'>Password</label>
            <input disabled id='pending-password' type='password' />
          </div>
        </>
      }
      footer='Need an account? Sign up'
      onSubmit={async () => {}}
      submitLabel='Sign in'
      title='Login'
    />
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthCard
      busy={busy}
      description='Sign in to Veles.'
      error={error}
      fields={
        <>
          <div className={css.field}>
            <label htmlFor='email'>Email</label>
            <input autoComplete='email' id='email' name='email' required type='email' />
          </div>
          <div className={css.field}>
            <label htmlFor='password'>Password</label>
            <input
              autoComplete='current-password'
              id='password'
              name='password'
              required
              type='password'
            />
          </div>
        </>
      }
      footer={
        <>
          Need an account? <Link to={'/signup' as never}>Sign up</Link>
        </>
      }
      onGoogle={async () => {
        setBusy(true);
        setError(null);

        try {
          await signIn.social({
            provider: 'google',
            callbackURL: '/',
          });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Google sign-in failed');
        } finally {
          setBusy(false);
        }
      }}
      onSubmit={async (formData) => {
        setBusy(true);
        setError(null);

        try {
          const result = await signIn.email({
            email: String(formData.get('email') || ''),
            password: String(formData.get('password') || ''),
          });

          if (result.error) {
            setError(result.error.message || 'Login failed');
            return;
          }

          navigate({ to: '/' as never });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';

          alert(message);
          setError(message);
        } finally {
          setBusy(false);
        }
      }}
      submitLabel='Sign in'
      title='Login'
    />
  );
}
