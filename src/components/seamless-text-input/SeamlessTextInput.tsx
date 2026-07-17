import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import css from './SeamlessTextInput.module.css';

type SeamlessTextInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'className'> & {
  className?: string;
};

export function SeamlessTextInput({ className, ...props }: SeamlessTextInputProps) {
  return <input className={clsx(css.root, className)} {...props} />;
}
