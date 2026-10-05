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
};

export const rulerStyle = (offset: number): CSSProperties & { '--scrub-offset': string } => ({
  '--scrub-offset': `${offset}px`,
});

/**
 * Table cell you drag sideways to change, tap to open the set sheet. Small chevrons hint at the
 * gesture on touch screens; a tick ruler slides under the value while dragging.
 */
export function ScrubCell({
  'aria-label': ariaLabel,
  format,
  placeholder,
  ...options
}: ScrubCellProps) {
  const { handlers, precision, scrub } = useScrub({ ...options, fallback: placeholder ?? 0 });
  const empty = options.value === null;
  const shown = options.value ?? placeholder;

  return (
    <div
      aria-label={ariaLabel}
      aria-valuenow={options.value ?? undefined}
      className={clsx(css.cell, empty && css.empty, scrub && css.scrubbing)}
      role='spinbutton'
      style={rulerStyle(scrub?.offset ?? 0)}
      tabIndex={0}
      {...handlers}
    >
      <ChevronLeftIcon aria-hidden='true' className={css.hintChevron} />
      <span className={css.cellValue}>{shown === null ? '–' : format(shown)}</span>
      <ChevronRightIcon aria-hidden='true' className={css.hintChevron} />
      {scrub ? <span className={css.precision}>±{precision}</span> : null}
    </div>
  );
}
