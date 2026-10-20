import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { getSafeRedirectPath } from '@/lib/auth/getSafeRedirectPath';
import css from './LoginPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function LoginPage({ redirect }: { redirect?: string }) {
  const { t } = useI18n();
  const callbackURL = getSafeRedirectPath(redirect);
  const googleSignInUrl = `/auth/google?redirect=${encodeURIComponent(callbackURL)}`;

  return (
    <section className={css.authShell}>
      <h1 className={css.authTitle}>{t({ en: 'Sign in', pl: 'Zaloguj się' })}</h1>
      <Card className={css.authCard}>
        <div className={css.authHeader}>
          <p>
            {t({
              en: 'Continue with an invited Google account.',
              pl: 'Kontynuuj z zaproszonym kontem Google.',
            })}
          </p>
        </div>

        <Btn isLink render={<a href={googleSignInUrl} />} variant='main'>
          {t({ en: 'Continue with Google', pl: 'Kontynuuj z Google' })}
        </Btn>
      </Card>
    </section>
  );
}
