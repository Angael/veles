import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { Label } from '@/components/ui/label/Label';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import css from './FormLayout.module.css';

/**
 * Page body for task-layout forms. The task header owns the title and back button, so this only
 * adds an optional one-line lead above context (summary cards, help) and the form card.
 */
export function FormPage({
  children,
  className,
  lead,
}: {
  children: ReactNode;
  className?: string;
  lead?: ReactNode;
}) {
  return (
    <main className={clsx(css.page, className)}>
      {lead ? <p className={css.lead}>{lead}</p> : null}
      {children}
    </main>
  );
}

/** The single Card holding a task form's inputs, with the shared field spacing. */
export function FormCard({ className, ...props }: ComponentPropsWithoutRef<typeof TypedForm>) {
  return (
    <Card as='section'>
      <TypedForm className={clsx(css.form, className)} {...props} />
    </Card>
  );
}

type FormFooterProps = {
  /** Renders the required "Date" field beside the submit button. */
  date?: Omit<ComponentPropsWithoutRef<typeof DateInput>, 'required'>;
  disabled?: boolean;
  loading?: boolean;
  submitLabel: ReactNode;
};

/**
 * Last row of every task form: optional date on the left, the one primary submit on the right.
 * Keeping both here makes date placement and submit styling identical across flows.
 */
export function FormFooter({ date, disabled, loading, submitLabel }: FormFooterProps) {
  return (
    <div className={css.footer}>
      {date ? (
        <Label className={css.date} text='Date'>
          <DateInput name='date' required {...date} />
        </Label>
      ) : null}
      <Btn className={css.submit} disabled={disabled} loading={loading} type='submit'>
        {submitLabel}
      </Btn>
    </div>
  );
}
