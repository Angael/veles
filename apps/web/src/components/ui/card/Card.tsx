import clsx from 'clsx';
import type { ComponentPropsWithoutRef, PointerEvent } from 'react';
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
  onPointerMove,
  ...props
}: CardProps) {
  return (
    <Component
      className={clsx(css.card, tone && [css.toned, css[tone]], !shadow && css.noShadow, className)}
      onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
        trackSpotlight(event);
        onPointerMove?.(event);
      }}
      {...props}
    />
  );
}

/** Feeds the hover spotlight its position; touch has no hover, so only mice and pens count. */
function trackSpotlight(event: PointerEvent<HTMLElement>) {
  if (event.pointerType === 'touch') return;
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  card.style.setProperty('--card-spot-x', `${event.clientX - rect.left}px`);
  card.style.setProperty('--card-spot-y', `${event.clientY - rect.top}px`);
}
