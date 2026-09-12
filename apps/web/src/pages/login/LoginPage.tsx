import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AuthCard } from './AuthCard';
import { signIn } from '@/lib/auth/client';
import { sessionUserQueryKey } from '@/lib/auth/session.query';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';
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

export function LoginPage({ redirect }: { redirect?: string }) {
  const { busy, error, runAuthAction } = useAuthAction();
  const queryClient = useQueryClient();
  const autoSignInStartedRef = useRef(false);

  async function handleGoogleSignIn() {
    await runAuthAction(async () => {
      const result = await signIn.social({
        provider: 'google',
        callbackURL: getSafeRedirectPath(redirect),
      });

      if (!result.error) {
        queryClient.removeQueries({ queryKey: sessionUserQueryKey });
      }
    }, 'Google sign-in failed');
  }

  useEffect(() => {
    if (autoSignInStartedRef.current) {
      return;
    }

    autoSignInStartedRef.current = true;
    void handleGoogleSignIn();
  }, []);

  return (
    <AuthCard
      busy={busy}
      description='Continue with an invited Google account.'
      error={error}
      onGoogle={handleGoogleSignIn}
      title='Sign in'
    />
  );
}
