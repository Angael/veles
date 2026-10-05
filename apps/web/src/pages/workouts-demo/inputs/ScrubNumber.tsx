import { useRef, useState } from 'react';
import css from './Inputs.module.css';

type ScrubNumberProps = {
  label: string;
  onChange: (value: number) => void;
  /** Pixels of horizontal drag per step. */
  pixelsPerStep?: number;
  step: number;
  unit: string;
  value: number;
};

/**
 * Drag left/right on the number to change it (like Figma's scrubbable fields); a plain tap still
 * focuses the input for typing. One thumb, no keyboard, no tiny +/- targets.
 */
export function ScrubNumber({
  label,
  onChange,
  pixelsPerStep = 12,
  step,
  unit,
  value,
}: ScrubNumberProps) {
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null);
  const [scrubbing, setScrubbing] = useState(false);

  return (
    <label className={css.scrub} data-scrubbing={scrubbing || undefined}>
      <span className={css.scrubLabel}>{label}</span>
      <input
        className={css.scrubInput}
        inputMode='decimal'
        onChange={(event) => {
          const next = Number(event.target.value.replace(',', '.'));
          if (Number.isFinite(next)) onChange(next);
        }}
        onPointerDown={(event) => {
          drag.current = { moved: false, start: value, x: event.clientX };
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const steps = Math.round((event.clientX - drag.current.x) / pixelsPerStep);
          if (!drag.current.moved && Math.abs(steps) < 1) return;
          if (!drag.current.moved) {
            drag.current.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            setScrubbing(true);
          }
          const next = Math.max(0, drag.current.start + steps * step);
          if (next !== value) {
            onChange(Number(next.toFixed(2)));
            if ('vibrate' in navigator) navigator.vibrate(4);
          }
        }}
        onPointerUp={(event) => {
          if (drag.current?.moved) event.preventDefault();
          drag.current = null;
          setScrubbing(false);
        }}
        value={value}
      />
      <span className={css.scrubUnit}>{unit}</span>
    </label>
  );
}
