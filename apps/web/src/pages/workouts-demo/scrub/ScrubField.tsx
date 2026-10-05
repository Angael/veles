import clsx from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { rulerStyle } from './ScrubCell';
import { useScrub, type ScrubOptions } from './useScrub';
import css from './Scrub.module.css';

type ScrubFieldProps = Omit<ScrubOptions, 'onTap'> & {
  label: string;
  unit: string;
  format?: (value: number) => string;
  parse?: (text: string) => number | null;
};

const defaultParse = (text: string) => {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() && Number.isFinite(value) ? value : null;
};

/**
 * Big number for the set sheet: drag the number sideways (accelerated), tap it to type, or use
 * the ± buttons. The number box has a fixed width, so 90 → 92.5 never shifts the layout.
 */
export function ScrubField({
  format = String,
  label,
  parse = defaultParse,
  unit,
  ...options
}: ScrubFieldProps) {
  const [typing, setTyping] = useState(false);
  const { handlers, precision, scrub } = useScrub({ ...options, onTap: () => setTyping(true) });
  const current = options.value ?? options.fallback;
  const nudge = (delta: number) =>
    options.onChange(Math.max(options.min ?? 0, Number((current + delta).toFixed(3))));

  return (
    <div className={css.field}>
      <span className={css.fieldLabel}>
        {label}
        {scrub ? (
          <span className={css.fieldPrecision}>
            {/* Live speed bar: shows the drag getting more precise as you slow down. */}
            <span
              className={css.speed}
              style={{ inlineSize: `${Math.min(100, (scrub.velocity / 1.2) * 100)}%` }}
            />
            ±{precision}
          </span>
        ) : null}
      </span>
      <button
        aria-label={`Less ${label}`}
        className={css.nudge}
        onClick={() => nudge(-options.step)}
        type='button'
      >
        <MinusIcon aria-hidden='true' />
      </button>
      {typing ? (
        <input
          aria-label={label}
          autoFocus
          className={css.fieldInput}
          defaultValue={options.value ?? ''}
          inputMode='decimal'
          onBlur={(event) => {
            const parsed = parse(event.target.value);
            if (parsed !== null) options.onChange(parsed);
            setTyping(false);
          }}
          onFocus={(event) => event.target.select()}
          onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
          placeholder={format(options.fallback)}
        />
      ) : (
        <div
          aria-label={`${label}, drag sideways or tap to type`}
          aria-valuenow={current}
          className={clsx(
            css.fieldValue,
            scrub && css.scrubbing,
            options.value === null && css.empty,
          )}
          role='spinbutton'
          style={rulerStyle(scrub?.offset ?? 0)}
          tabIndex={0}
          {...handlers}
        >
          <ChevronLeftIcon aria-hidden='true' className={css.hintChevron} />
          <span className={css.fieldNumber}>{format(current)}</span>
          <ChevronRightIcon aria-hidden='true' className={css.hintChevron} />
        </div>
      )}
      <button
        aria-label={`More ${label}`}
        className={css.nudge}
        onClick={() => nudge(options.step)}
        type='button'
      >
        <PlusIcon aria-hidden='true' />
      </button>
      <span className={css.fieldUnit}>{unit}</span>
    </div>
  );
}
