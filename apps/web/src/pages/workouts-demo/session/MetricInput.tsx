import { useEffect, useState } from 'react';
import { formatDuration } from '../mockData';
import css from './Session.module.css';

type MetricInputProps = {
  'aria-label': string;
  kind: 'number' | 'time';
  onChange: (value: number | null) => void;
  /** Last time's value, shown as a ghost; checking the set without typing adopts it. */
  placeholder: number | null;
  value: number | null;
};

function format(kind: MetricInputProps['kind'], value: number | null) {
  if (value === null) return '';
  return kind === 'time' ? formatDuration(value) : String(value);
}

/** Accepts `90`, `1:30` or `1.5m` for time; plain decimals with `,` or `.` for numbers. */
function parse(kind: MetricInputProps['kind'], text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (!trimmed) return null;
  if (kind === 'time') {
    const clock = /^(\d+):(\d{1,2})$/.exec(trimmed);
    if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
    const minutes = /^(\d+(?:\.\d+)?)m$/.exec(trimmed);
    if (minutes) return Math.round(Number(minutes[1]) * 60);
  }
  const value = Number(trimmed.replace(/s$/, ''));
  return Number.isFinite(value) ? value : null;
}

/**
 * Bare table-cell input: no label, no stepper, just a big tap target that brings up the numeric
 * keyboard. Enter jumps to the next cell, like a spreadsheet.
 */
export function MetricInput({
  'aria-label': ariaLabel,
  kind,
  onChange,
  placeholder,
  value,
}: MetricInputProps) {
  const [text, setText] = useState(() => format(kind, value));
  useEffect(() => setText(format(kind, value)), [kind, value]);

  return (
    <input
      aria-label={ariaLabel}
      className={css.metric}
      enterKeyHint='next'
      inputMode={kind === 'time' ? 'text' : 'decimal'}
      onBlur={() => onChange(parse(kind, text))}
      onChange={(event) => setText(event.target.value)}
      onFocus={(event) => event.target.select()}
      onKeyDown={(event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const inputs = [...document.querySelectorAll<HTMLInputElement>(`.${css.metric}`)];
        inputs[inputs.indexOf(event.currentTarget) + 1]?.focus();
      }}
      placeholder={format(kind, placeholder)}
      value={text}
    />
  );
}
