import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import css from './Session.module.css';

type SetTypeFlashProps = {
  badge: number | string;
  label: string;
  note: string;
  onDone: () => void;
};

/**
 * The set badge briefly unrolls into a pill naming the type it just switched to, so a tap on
 * "D" or "F" explains itself on touch screens too. Remount with a new key to replay. A press
 * anywhere outside the badge rolls it back early, so it never covers what the user reaches for.
 */
export function SetTypeFlash({ badge, label, note, onDone }: SetTypeFlashProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const trigger = ref.current?.parentElement;
      if (event.target instanceof Node && trigger?.contains(event.target)) return;
      setClosing(true);
    }
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  return (
    <span
      aria-hidden='true'
      className={clsx(css.typeFlash, closing && css.typeFlashClosing)}
      onAnimationEnd={(event) => event.target === event.currentTarget && onDone()}
      ref={ref}
    >
      <span className={css.typeFlashBadge}>{badge}</span>
      <span className={css.typeFlashText}>
        <strong>{label}</strong> {note}
      </span>
    </span>
  );
}
