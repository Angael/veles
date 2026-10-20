import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { useI18n } from '@/lib/i18n/I18nProvider';
import css from './DefaultCatchBoundary.module.css';

export function DefaultCatchBoundary(props: ErrorComponentProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  /** Reloads failed route data while preventing repeated retry requests. */
  async function retry() {
    setIsRetrying(true);

    try {
      await router.invalidate();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <main className={css.page}>
      <Card as='section' aria-labelledby='catch-boundary-title' className={css.panel} tone='danger'>
        <div className={css.copy}>
          <h1 id='catch-boundary-title'>
            {t({ en: 'Something went wrong', pl: 'Coś poszło nie tak' })}
          </h1>
        </div>
        <p className={css.message} role='alert'>
          {props.error instanceof Error
            ? props.error.message
            : t({ en: 'An unexpected error occurred.', pl: 'Wystąpił nieoczekiwany błąd.' })}
        </p>
        <Btn loading={isRetrying} onClick={() => void retry()} type='button'>
          {t({ en: 'Try again', pl: 'Spróbuj ponownie' })}
        </Btn>
      </Card>
    </main>
  );
}
