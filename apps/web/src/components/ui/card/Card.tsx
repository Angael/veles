import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import css from './Card.module.css';

/**
 * Strengthens the card's corner glow. Untoned cards already carry a faint page accent; `accent`
 * turns it up, `primary` uses the pale accent tint. Pages can pick any color by setting
 * `--card-tone` (and optionally `--card-tone-secondary`) on the card's className.
 */
export type CardTone = 'primary' | 'accent' | 'danger';

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
