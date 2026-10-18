import clsx from 'clsx';
import { MousePointer2Icon } from 'lucide-react';
import css from './Hints.module.css';

type PointerProps = { coarse: boolean; pressed: boolean; visible?: boolean; x: number; y: number };

/**
 * Demo pointer: a finger dot on touch screens, an arrow cursor with a click ring on desktop.
 * `pressed` shrinks it and shows a ring, so the press is visible, not just the movement.
 */
export function Pointer({ coarse, pressed, visible = true, x, y }: PointerProps) {
  return (
    <span
      aria-hidden='true'
      className={clsx(css.pointer, pressed && css.pressed)}
      style={{ opacity: visible ? 1 : 0, translate: `${x}px ${y}px` }}
    >
      <span className={css.pressRing} />
      {coarse ? <span className={css.fingerDot} /> : <MousePointer2Icon className={css.cursor} />}
    </span>
  );
}
