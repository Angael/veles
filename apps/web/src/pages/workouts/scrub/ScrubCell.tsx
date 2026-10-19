import clsx from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useScrub, type ScrubOptions } from './useScrub';
import css from './Scrub.module.css';

type ScrubCellProps = Omit<ScrubOptions, 'fallback' | 'onTap'> & {
  'aria-label': string;
  format: (value: number) => string;
  /** Reads typed text; null keeps the current value. */
  parse: (text: string) => number | null;
  /** Last time's value: shown as a ghost and used as the drag start when empty. */
  placeholder: number | null;
  /** Small grey unit after the number, so weight and reps never get mixed up. */
  unit?: string;
};

export const rulerStyle = (offset: number): CSSProperties & { '--scrub-offset': string } => ({
  '--scrub-offset': `${offset}px`,
});

/**
 * Table cell you drag sideways to change, tap to type in place. Small chevrons hint at the
 * gesture on touch screens; a tick ruler slides with the finger while dragging. The input mounts
 * inside the tap's click handler, so mobile browsers open the on-screen keyboard.
 */
export function ScrubCell({
  'aria-label': ariaLabel,
  format,
  parse,
  placeholder,
  unit,
  ...options
}: ScrubCellProps) {
  const [typing, setTyping] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  /** Enter or Escape hands focus back to the cell, so keyboard users stay in place. */
  const returnFocus = useRef(false);
  const { handlers, offset } = useScrub({
    ...options,
    fallback: placeholder ?? 0,
    onTap: () => setTyping(true),
  });
  const shown = options.value ?? placeholder;

  useEffect(() => {
    if (typing || !returnFocus.current) return;
    returnFocus.current = false;
    cellRef.current?.focus();
  }, [typing]);

  const unitLabel = unit ? <small className={css.cellUnit}>{unit}</small> : null;

  if (typing) {
    return (
      <label className={clsx(css.cell, css.typing)}>
        <input
          aria-label={ariaLabel}
          autoFocus
          className={css.cellInput}
          defaultValue={options.value === null ? '' : format(options.value)}
          enterKeyHint='done'
          inputMode='decimal'
          onBlur={(event) => {
            const parsed = parse(event.target.value);
            if (parsed !== null && parsed !== options.value) {
              options.onChange(Math.min(parsed, options.max ?? parsed));
            }
            setTyping(false);
          }}
          onFocus={(event) => event.target.select()}
          onKeyDown={(event) => {
            if (event.key === 'Escape') event.currentTarget.value = '';
            if (event.key !== 'Enter' && event.key !== 'Escape') return;
            returnFocus.current = true;
            event.currentTarget.blur();
          }}
          placeholder={shown === null ? undefined : format(shown)}
        />
        {unitLabel}
      </label>
    );
  }

  return (
    <div
      aria-label={`${ariaLabel}, drag sideways or tap to type`}
      aria-valuenow={options.value ?? undefined}
      className={clsx(
        css.cell,
        options.value === null && css.empty,
        offset !== null && css.scrubbing,
      )}
      ref={cellRef}
      role='spinbutton'
      style={rulerStyle(offset ?? 0)}
      tabIndex={0}
      {...handlers}
    >
      <ChevronLeftIcon aria-hidden='true' className={css.hintChevron} />
      <span className={css.cellValue}>
        {shown === null ? '' : format(shown)}
        {unitLabel}
      </span>
      <ChevronRightIcon aria-hidden='true' className={css.hintChevron} />
    </div>
  );
}
