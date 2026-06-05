import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import css from './Card.module.css';

type CardProps = ComponentPropsWithoutRef<'div'> & {
  as?: 'article' | 'div' | 'section';
  compact?: boolean;
};

export function Card({ as: Component = 'div', className, compact = false, ...props }: CardProps) {
  return <Component className={clsx(css.card, compact && css.compact, className)} {...props} />;
}
