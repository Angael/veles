import { AuthCard } from '@/components/auth-card/AuthCard';
import { signIn } from '@/lib/auth/client';
import { useAuthAction } from '@/lib/auth/useAuthAction';

export function LoginPendingPage() {
  return (
    <AuthCard
      busy={true}
      description='Continue with an invited Google account.'
      error={null}
      title='Sign in'
    />
  );
}

export function LoginPage() {
  const { busy, error, runAuthAction } = useAuthAction();

  return (
    <AuthCard
      busy={busy}
      description='Continue with an invited Google account.'
      error={error}
      onGoogle={async () => {
        await runAuthAction(async () => {
          await signIn.social({
            provider: 'google',
            callbackURL: '/',
          });
        }, 'Google sign-in failed');
      }}
      title='Sign in'
    />
  );
}
