import clsx from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import css from './Label.module.css';

type LabelProps = Omit<ComponentPropsWithoutRef<'label'>, 'className' | 'children'> & {
  children: ReactNode;
  className?: string;
  text: ReactNode;
};

export function Label({ children, className, text, ...props }: LabelProps) {
  return (
    <label className={clsx(css.root, className)} {...props}>
      <span>{text}</span>
      {children}
    </label>
  );
}
