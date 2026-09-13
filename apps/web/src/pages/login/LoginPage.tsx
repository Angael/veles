import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';
import css from './AuthCard.module.css';

type AuthCardProps = {
  title: string;
  description: string;
  googleHref?: string;
  busy: boolean;
  error: string | null;
};

function AuthCard(props: AuthCardProps) {
  const { busy, description, error, googleHref, title } = props;

  return (
    <section className={css.authShell}>
      <h1 className={css.authTitle}>{title}</h1>
      <Card className={css.authCard}>
        <div className={css.authHeader}>
          <p>{description}</p>
        </div>

        {error ? <div className={css.errorBox}>{error}</div> : null}

        <Btn
          disabled={!googleHref}
          isLink={Boolean(googleHref)}
          loading={busy}
          render={googleHref ? <a href={googleHref} /> : undefined}
          variant='main'
        >
          Continue with Google
        </Btn>
      </Card>
    </section>
  );
}

export function LoginPage({ redirect }: { redirect?: string }) {
  const callbackURL = getSafeRedirectPath(redirect);
  const googleSignInUrl = `/auth/google?redirect=${encodeURIComponent(callbackURL)}`;

  return (
    <AuthCard
      busy={false}
      description='Continue with an invited Google account.'
      error={null}
      googleHref={googleSignInUrl}
      title='Sign in'
    />
  );
}
