import type { ReactNode } from 'react';
import css from './FormSubmitRow.module.css';

/**
 * Closing row of a form: optional leading fields (such as a date) on the left and the submit
 * button, passed as the last child, on the right. Stacks with a full-width button on phones.
 */
export function FormSubmitRow({ children }: { children: ReactNode }) {
  return <div className={css.row}>{children}</div>;
}
