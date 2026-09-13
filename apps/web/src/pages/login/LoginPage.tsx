import { AuthCard } from './AuthCard';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';

export function LoginPage({ redirect }: { redirect?: string }) {
  const callbackURL = getSafeRedirectPath(redirect);
  const googleSignInUrl = `/auth/google?redirect=${encodeURIComponent(callbackURL)}`;

  return (
    <AuthCard
      description='Continue with an invited Google account.'
      googleHref={googleSignInUrl}
      title='Sign in'
    />
  );
}
