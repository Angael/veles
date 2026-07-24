import { AuthCard } from '@/components/auth-card/AuthCard';
import { signIn } from '@/lib/auth/client';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';
import { useAuthAction } from '@/lib/auth/useAuthAction';
import { Route } from '@/routes/login';

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
  const { redirect } = Route.useSearch();
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
            callbackURL: getSafeRedirectPath(redirect),
          });
        }, 'Google sign-in failed');
      }}
      title='Sign in'
    />
  );
}
