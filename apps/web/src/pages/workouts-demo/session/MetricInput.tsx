import { useEffect, useState } from 'react';
import { formatMetric, parseMetric, type MetricField } from './metrics';
import css from './Session.module.css';

type MetricInputProps = {
  field: MetricField;
  onChange: (value: number | null) => void;
  /** Last time's value, shown as a ghost; checking the set without typing adopts it. */
  placeholder: number | null;
  value: number | null;
};

const format = (field: MetricField, value: number | null) =>
  value === null ? '' : formatMetric(field, value);

/**
 * Bare table-cell input: no label, no stepper, just a big tap target that brings up the numeric
 * keyboard. Enter jumps to the next cell, like a spreadsheet.
 */
export function MetricInput({ field, onChange, placeholder, value }: MetricInputProps) {
  const [text, setText] = useState(() => format(field, value));
  useEffect(() => setText(format(field, value)), [field, value]);

  return (
    <input
      aria-label={field.label}
      className={css.metric}
      enterKeyHint='next'
      inputMode={field.kind === 'time' ? 'text' : 'decimal'}
      onBlur={() => onChange(parseMetric(field, text))}
      onChange={(event) => setText(event.target.value)}
      onFocus={(event) => event.target.select()}
      onKeyDown={(event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const inputs = [...document.querySelectorAll<HTMLInputElement>(`.${css.metric}`)];
        inputs[inputs.indexOf(event.currentTarget) + 1]?.focus();
      }}
      placeholder={format(field, placeholder)}
      value={text}
    />
  );
}
