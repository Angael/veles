import clsx from 'clsx';
import type { ComponentProps } from 'react';
import css from './SeamlessTextarea.module.css';

type SeamlessTextareaProps = Omit<ComponentProps<'textarea'>, 'className'> & {
  className?: string;
};

export function SeamlessTextarea({ className, ...props }: SeamlessTextareaProps) {
  return <textarea className={clsx(css.root, className)} {...props} />;
}
