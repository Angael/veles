import clsx from 'clsx';
import css from './WeightOverview.module.css';
import type { WeightChartRange } from './weightCalculations';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Localized } from '@/lib/i18n/locale';

export const WEIGHT_RANGE_OPTIONS = [
  { label: { en: '1 month', pl: '1 miesiąc' }, short: { en: '1M', pl: '1M' }, value: '1m' },
  { label: { en: '3 months', pl: '3 miesiące' }, short: { en: '3M', pl: '3M' }, value: '3m' },
  { label: { en: '6 months', pl: '6 miesięcy' }, short: { en: '6M', pl: '6M' }, value: '6m' },
  { label: { en: '1 year', pl: '1 rok' }, short: { en: '1Y', pl: '1R' }, value: '1y' },
  { label: { en: '2 years', pl: '2 lata' }, short: { en: '2Y', pl: '2L' }, value: '2y' },
  { label: { en: '3 years', pl: '3 lata' }, short: { en: '3Y', pl: '3L' }, value: '3y' },
  { label: { en: 'All time', pl: 'Cały okres' }, short: { en: 'All', pl: 'Całość' }, value: 'all' },
] satisfies { label: Localized; short: Localized; value: WeightChartRange }[];

type WeightRangePickerProps = {
  onChange: (range: WeightChartRange) => void;
  value: WeightChartRange;
};

/** One-tap segmented range switch under the chart; replaces a dropdown that cost its own row. */
export function WeightRangePicker({ onChange, value }: WeightRangePickerProps) {
  const { t } = useI18n();

  return (
    <div
      aria-label={t({ en: 'Chart time range', pl: 'Zakres czasu wykresu' })}
      className={css.rangePicker}
      role='radiogroup'
    >
      {WEIGHT_RANGE_OPTIONS.map((option) => (
        <button
          aria-checked={option.value === value}
          aria-label={t(option.label)}
          className={clsx(css.rangeOption, option.value === value && css.rangeOptionActive)}
          key={option.value}
          onClick={() => onChange(option.value)}
          role='radio'
          type='button'
        >
          {t(option.short)}
        </button>
      ))}
    </div>
  );
}
