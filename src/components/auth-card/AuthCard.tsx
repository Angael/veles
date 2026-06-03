import type * as React from 'react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './AuthCard.module.css';

type AuthCardProps = {
  title: string;
  description: string;
  submitLabel: string;
  footer: React.ReactNode;
  onSubmit: (formData: FormData) => Promise<void>;
  onGoogle?: () => Promise<void>;
  busy: boolean;
  error: string | null;
  fields: React.ReactNode;
};

export function AuthCard(props: AuthCardProps) {
  const { busy, description, error, fields, footer, onGoogle, onSubmit, submitLabel, title } =
    props;

  return (
    <section className={css.authShell}>
      <Card className={css.authCard}>
        <div className={css.authHeader}>
          <p className={css.eyebrow}>Private access</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        <form
          className={css.authForm}
          onSubmit={async (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            await onSubmit(formData);
          }}
        >
          {fields}
          {error ? <div className={css.errorBox}>{error}</div> : null}
          <Btn disabled={busy} type='submit' variant='primary'>
            {busy ? 'Working...' : submitLabel}
          </Btn>
        </form>

        <div className={css.authDivider}>or</div>

        <Btn
          className={css.authGoogle}
          disabled={busy || !onGoogle}
          onClick={() => void onGoogle?.()}
          variant='secondary'
        >
          Continue with Google
        </Btn>

        <div className={css.authFooter}>{footer}</div>
      </Card>
    </section>
  );
}
