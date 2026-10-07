import clsx from 'clsx';
import { DumbbellIcon, RepeatIcon, RouteIcon, TimerIcon, WeightIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { MEASURE_LABELS, type Measure } from '../metrics';
import css from './MeasurePicker.module.css';

/** Most common first; the grid gives the first three the top row. */
const OPTIONS: { measure: Measure; Icon: ComponentType<{ 'aria-hidden': 'true' }> }[] = [
  { Icon: DumbbellIcon, measure: 'weight_reps' },
  { Icon: RepeatIcon, measure: 'reps' },
  { Icon: TimerIcon, measure: 'duration' },
  { Icon: WeightIcon, measure: 'weight_duration' },
  { Icon: RouteIcon, measure: 'distance_duration' },
];

type MeasurePickerProps = { onChange: (measure: Measure) => void; value: Measure };

/**
 * What an exercise tracks, as a grid of big cells instead of wrapping pills: 3 + 2 on phones
 * (the bottom two stretch to fill the row), one row of 5 on wider screens.
 */
export function MeasurePicker({ onChange, value }: MeasurePickerProps) {
  return (
    <div aria-label='What to track' className={css.grid} role='radiogroup'>
      {OPTIONS.map(({ Icon, measure }) => (
        <button
          aria-checked={measure === value}
          className={clsx(css.cell, measure === value && css.active)}
          key={measure}
          onClick={() => onChange(measure)}
          role='radio'
          type='button'
        >
          <Icon aria-hidden='true' />
          {MEASURE_LABELS[measure]}
        </button>
      ))}
    </div>
  );
}
