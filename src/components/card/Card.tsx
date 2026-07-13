import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import css from './Card.module.css';

export type CardVariant = 'default' | 'primary' | 'danger';

type CardProps = ComponentPropsWithoutRef<'div'> & {
  as?: 'article' | 'aside' | 'div' | 'section';
  shadow?: boolean;
  variant?: CardVariant;
};

export function Card({
  as: Component = 'div',
  className,
  shadow = true,
  variant = 'default',
  ...props
}: CardProps) {
  return (
    <Component
      className={clsx(css.card, css[variant], !shadow && css.noShadow, className)}
      {...props}
    />
  );
}
