import clsx from 'clsx';
import { DumbbellIcon, RepeatIcon, RouteIcon, TimerIcon, WeightIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { MEASURE_LABELS, type Measure } from '../metrics';
import css from './MeasurePicker.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Most common first; the grid gives the first three the top row. */
const OPTIONS: { measure: Measure; Icon: ComponentType<{ 'aria-hidden': 'true' }> }[] = [
  { Icon: DumbbellIcon, measure: 'weight_reps' },
  { Icon: RepeatIcon, measure: 'reps' },
  { Icon: TimerIcon, measure: 'duration' },
  { Icon: WeightIcon, measure: 'weight_duration' },
  { Icon: RouteIcon, measure: 'distance_duration' },
];

type MeasurePickerProps = {
  onChange: (measure: Measure) => void;
  value: Measure;
  /**
   * Turns the cells into action buttons ("Create as Reps") instead of a radio group; `value` is
   * then only the highlighted cell.
   */
  actionLabel?: (measureLabel: string) => string;
};

/**
 * What an exercise tracks, as a grid of big cells instead of wrapping pills: 3 + 2 on phones
 * (the bottom two stretch to fill the row), one row of 5 on wider screens.
 */
export function MeasurePicker({ actionLabel, onChange, value }: MeasurePickerProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t({ en: 'What to track', pl: 'Co mierzyć' })}
      className={css.grid}
      role={actionLabel ? 'group' : 'radiogroup'}
    >
      {OPTIONS.map(({ Icon, measure }) => (
        <button
          aria-checked={actionLabel ? undefined : measure === value}
          aria-label={actionLabel?.(t(MEASURE_LABELS[measure]))}
          className={clsx(css.cell, measure === value && css.active)}
          key={measure}
          onClick={() => onChange(measure)}
          role={actionLabel ? undefined : 'radio'}
          type='button'
        >
          <Icon aria-hidden='true' />
          {t(MEASURE_LABELS[measure])}
        </button>
      ))}
    </div>
  );
}
