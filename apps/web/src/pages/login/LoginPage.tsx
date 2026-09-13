import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';
import css from './LoginPage.module.css';

export function LoginPage({ redirect }: { redirect?: string }) {
  const callbackURL = getSafeRedirectPath(redirect);
  const googleSignInUrl = `/auth/google?redirect=${encodeURIComponent(callbackURL)}`;

  return (
    <section className={css.authShell}>
      <h1 className={css.authTitle}>Sign in</h1>
      <Card className={css.authCard}>
        <div className={css.authHeader}>
          <p>Continue with an invited Google account.</p>
        </div>

        <Btn isLink render={<a href={googleSignInUrl} />} variant='main'>
          Continue with Google
        </Btn>
      </Card>
    </section>
  );
}
