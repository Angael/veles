import clsx from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useScrub, type ScrubOptions } from './useScrub';
import css from './Scrub.module.css';

type ScrubCellProps = Omit<ScrubOptions, 'fallback'> & {
  'aria-label': string;
  format: (value: number) => string;
  /** Last time's value: shown as a ghost and used as the drag start when empty. */
  placeholder: number | null;
  /** Small grey unit after the number, so weight and reps never get mixed up. */
  unit?: string;
};

export const rulerStyle = (offset: number): CSSProperties & { '--scrub-offset': string } => ({
  '--scrub-offset': `${offset}px`,
});

/**
 * Table cell you drag sideways to change, tap to open the set sheet. Small chevrons hint at the
 * gesture on touch screens; a tick ruler slides with the finger while dragging.
 */
export function ScrubCell({
  'aria-label': ariaLabel,
  format,
  placeholder,
  unit,
  ...options
}: ScrubCellProps) {
  const { handlers, offset } = useScrub({ ...options, fallback: placeholder ?? 0 });
  const shown = options.value ?? placeholder;

  return (
    <div
      aria-label={ariaLabel}
      aria-valuenow={options.value ?? undefined}
      className={clsx(
        css.cell,
        options.value === null && css.empty,
        offset !== null && css.scrubbing,
      )}
      role='spinbutton'
      style={rulerStyle(offset ?? 0)}
      tabIndex={0}
      {...handlers}
    >
      <ChevronLeftIcon aria-hidden='true' className={css.hintChevron} />
      <span className={css.cellValue}>
        {shown === null ? '' : format(shown)}
        {unit ? <small className={css.cellUnit}>{unit}</small> : null}
      </span>
      <ChevronRightIcon aria-hidden='true' className={css.hintChevron} />
    </div>
  );
}
