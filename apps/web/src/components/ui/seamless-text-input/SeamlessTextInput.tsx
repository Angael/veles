import clsx from 'clsx';
import type { ComponentProps } from 'react';
import css from './SeamlessTextInput.module.css';

type SeamlessTextInputProps = Omit<ComponentProps<'input'>, 'className'> & {
  className?: string;
};

export function SeamlessTextInput({ className, ...props }: SeamlessTextInputProps) {
  return <input className={clsx(css.root, className)} {...props} />;
}
