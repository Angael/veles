import type * as React from 'react';
import { Card } from '@/components/Card';
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
          <button className={css.primaryButton} disabled={busy} type='submit'>
            {busy ? 'Working...' : submitLabel}
          </button>
        </form>

        <div className={css.authDivider}>or</div>

        <button
          className={css.secondaryButton}
          disabled={busy || !onGoogle}
          onClick={() => void onGoogle?.()}
          type='button'
        >
          Continue with Google
        </button>

        <div className={css.authFooter}>{footer}</div>
      </Card>
    </section>
  );
}
