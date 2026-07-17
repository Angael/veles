import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './DefaultCatchBoundary.module.css';

export function DefaultCatchBoundary(props: ErrorComponentProps) {
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
      <Card
        as='section'
        aria-labelledby='catch-boundary-title'
        className={css.panel}
        variant='danger'
      >
        <div className={css.copy}>
          <h1 id='catch-boundary-title'>Something went wrong</h1>
        </div>
        <p className={css.message} role='alert'>
          {props.error.message}
        </p>
        <Btn loading={isRetrying} onClick={() => void retry()} type='button'>
          Try again
        </Btn>
      </Card>
    </main>
  );
}
