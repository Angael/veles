import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import css from './Card.module.css';

/**
 * Colors the card's corner glow. Pages can also pick any color by setting `--card-tone` (and
 * optionally `--card-tone-secondary`) on the card's className together with a tone.
 */
export type CardTone = 'primary' | 'sky' | 'danger';

type CardProps = ComponentPropsWithoutRef<'div'> & {
  as?: 'article' | 'aside' | 'div' | 'section';
  shadow?: boolean;
  tone?: CardTone;
};

export function Card({
  as: Component = 'div',
  className,
  shadow = true,
  tone,
  ...props
}: CardProps) {
  return (
    <Component
      className={clsx(css.card, tone && [css.toned, css[tone]], !shadow && css.noShadow, className)}
      {...props}
    />
  );
}
