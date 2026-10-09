import css from './Session.module.css';

type SetTypeFlashProps = {
  badge: number | string;
  label: string;
  note: string;
  onDone: () => void;
};

/**
 * The set badge briefly unrolls into a pill naming the type it just switched to, so a tap on
 * "D" or "F" explains itself on touch screens too. Remount with a new key to replay.
 */
export function SetTypeFlash({ badge, label, note, onDone }: SetTypeFlashProps) {
  return (
    <span
      aria-hidden='true'
      className={css.typeFlash}
      onAnimationEnd={(event) => event.target === event.currentTarget && onDone()}
    >
      <span className={css.typeFlashBadge}>{badge}</span>
      <span className={css.typeFlashText}>
        <strong>{label}</strong> {note}
      </span>
    </span>
  );
}
