import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { AuthCard } from '@/components/auth-card/AuthCard';
import css from './SignupPage.module.css';
import { signIn, signUp } from '@/lib/auth/client';

export function SignupPendingPage() {
  return (
    <AuthCard
      busy={true}
      description='Loading account creation form.'
      error={null}
      fields={
        <>
          <div className={css.field}>
            <label htmlFor='pending-name'>Name</label>
            <input
              autoComplete='name'
              disabled
              id='pending-name'
              placeholder='Ada Lovelace'
              type='text'
            />
          </div>
          <div className={css.field}>
            <label htmlFor='pending-email'>Email</label>
            <input
              autoComplete='email'
              disabled
              id='pending-email'
              placeholder='name@example.com'
              type='email'
            />
          </div>
          <div className={css.field}>
            <label htmlFor='pending-password'>Password</label>
            <input disabled id='pending-password' placeholder='********' type='password' />
          </div>
        </>
      }
      footer='Already have an account? Log in'
      onSubmit={async () => {}}
      submitLabel='Create account'
      title='Sign up'
    />
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthCard
      busy={busy}
      description='Create a Veles account.'
      error={error}
      fields={
        <>
          <div className={css.field}>
            <label htmlFor='name'>Name</label>
            <input
              autoComplete='name'
              id='name'
              name='name'
              placeholder='Ada Lovelace'
              required
              type='text'
            />
          </div>
          <div className={css.field}>
            <label htmlFor='email'>Email</label>
            <input
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
            <input
              autoComplete='new-password'
              id='password'
              minLength={8}
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
          Already have an account? <Link to={'/login'}>Log in</Link>
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
          const result = await signUp.email({
            name: String(formData.get('name') || ''),
            email: String(formData.get('email') || ''),
            password: String(formData.get('password') || ''),
          });

          if (result.error) {
            setError(result.error.message || 'Signup failed');
            return;
          }

          navigate({ to: '/' });
        } catch (err) {
          setError(String(err || 'Signup failed'));
          return;
        } finally {
          setBusy(false);
        }
      }}
      submitLabel='Create account'
      title='Sign up'
    />
  );
}
