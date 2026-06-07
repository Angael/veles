import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import css from './Card.module.css';

type CardProps = ComponentPropsWithoutRef<'div'> & {
  as?: 'article' | 'div' | 'section';
};

export function Card({ as: Component = 'div', className, ...props }: CardProps) {
  return <Component className={clsx(css.card, className)} {...props} />;
}
