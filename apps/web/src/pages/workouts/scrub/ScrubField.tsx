import clsx from 'clsx';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
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
  return text.trim() && Number.isFinite(value) && value >= 0 ? value : null;
};

/**
 * Big number: drag it sideways (speed picks the step) or tap it to type. The box has a fixed
 * width, so 90 → 92.5 never shifts the layout.
 */
export function ScrubField({
  format = String,
  label,
  parse = defaultParse,
  unit,
  ...options
}: ScrubFieldProps) {
  const [typing, setTyping] = useState(false);
  const { handlers, offset } = useScrub({ ...options, onTap: () => setTyping(true) });
  const current = options.value ?? options.fallback;

  return (
    <div className={css.field}>
      <span className={css.fieldLabel}>{label}</span>
      {typing ? (
        <input
          aria-label={label}
          autoFocus
          className={css.fieldInput}
          defaultValue={options.value ?? ''}
          inputMode='decimal'
          onBlur={(event) => {
            const parsed = parse(event.target.value);
            if (parsed !== null) options.onChange(Math.min(parsed, options.max ?? parsed));
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
            offset !== null && css.scrubbing,
            options.value === null && css.empty,
          )}
          role='spinbutton'
          style={rulerStyle(offset ?? 0)}
          tabIndex={0}
          {...handlers}
        >
          <ChevronLeftIcon aria-hidden='true' className={css.hintChevron} />
          <span className={css.fieldNumber}>{format(current)}</span>
          <ChevronRightIcon aria-hidden='true' className={css.hintChevron} />
        </div>
      )}
      <span className={css.fieldUnit}>{unit}</span>
    </div>
  );
}
