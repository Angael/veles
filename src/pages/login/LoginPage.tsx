import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { AuthCard } from '@/components/auth-card/AuthCard';
import { TextInput } from '@/components/text-input/TextInput';
import css from './LoginPage.module.css';
import { signIn } from '@/lib/auth/client';

export function LoginPendingPage() {
  return (
    <AuthCard
      busy={true}
      description='Loading sign-in form.'
      error={null}
      fields={
        <>
          <div className={css.field}>
            <label htmlFor='pending-email'>Email</label>
            <TextInput
              autoComplete='email'
              disabled
              id='pending-email'
              placeholder='name@example.com'
              type='email'
            />
          </div>
          <div className={css.field}>
            <label htmlFor='pending-password'>Password</label>
            <TextInput disabled id='pending-password' placeholder='********' type='password' />
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

export function LoginPage() {
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
            <TextInput
              autoComplete='email'
              id='email'
              name='email'
              placeholder='name@example.com'
              required
              type='email'
            />
          </div>
          <div className={css.field}>
            <label htmlFor='password'>Password</label>
            <TextInput
              autoComplete='current-password'
              id='password'
              name='password'
              placeholder='********'
              required
              type='password'
            />
          </div>
        </>
      }
      footer={
        <>
          Need an account? <Link to={'/signup'}>Sign up</Link>
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

          navigate({ to: '/' });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';

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
