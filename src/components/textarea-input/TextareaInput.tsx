import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import css from './TextareaInput.module.css';

type TextareaInputProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'className'> & {
  className?: string;
};

export function TextareaInput({ className, ...props }: TextareaInputProps) {
  return <textarea className={clsx(css.root, className)} {...props} />;
}
