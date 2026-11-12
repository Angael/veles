import { Card } from '@/components/ui/card/Card';
import css from './WorkoutStats.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

type BarChartProps = {
  'data-appear'?: string;
  /** Full name of a bar, for its accessible label. */
  detail: (index: number) => string;
  labels: string[];
  /** Heading that names the tallest bar. */
  title: (topIndex: number) => string;
  values: number[];
};

/** Session counts as columns, with the tallest one lit and named in the heading. */
export function BarChart({ detail, labels, title, values, ...props }: BarChartProps) {
  const { t } = useI18n();
  const max = Math.max(...values, 0);
  const top = values.indexOf(max);

  return (
    <Card as='section' className={css.section} data-appear={props['data-appear']}>
      <h2>{title(top)}</h2>
      <ol className={css.bars}>
        {values.map((value, index) => (
          <li
            aria-label={t({
              en: `${detail(index)}: ${value} ${pluralEn(value, 'workout', 'workouts')}`,
              pl: `${detail(index)}: ${value} ${pluralPl(value, 'trening', 'treningi', 'treningów')}`,
            })}
            data-top={value === max && max > 0 ? '' : undefined}
            key={labels[index]}
          >
            <span aria-hidden='true' className={css.barValue}>
              {value || ''}
            </span>
            <span
              aria-hidden='true'
              className={css.bar}
              style={{ blockSize: `${max ? (value / max) * 100 : 0}%` }}
            />
            <span aria-hidden='true' className={css.barLabel}>
              {labels[index]}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
