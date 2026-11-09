import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import css from './Calendar.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';
import type { WorkoutSummary } from '../../workouts.server';
import { formatCompactDuration, totalsOf } from './calendarDates';

type CalendarHeaderProps = {
  nextLabel: string;
  onNext: (() => void) | undefined;
  onPrevious: (() => void) | undefined;
  /** Absent while the current month or week is on screen. */
  onToday: (() => void) | undefined;
  previousLabel: string;
  summary: ReactNode;
  title: string;
};

/** Period title with its totals, plus the arrows and the way back to today. */
export function CalendarHeader({
  nextLabel,
  onNext,
  onPrevious,
  onToday,
  previousLabel,
  summary,
  title,
}: CalendarHeaderProps) {
  const { t } = useI18n();

  return (
    <header className={css.header}>
      <div className={css.heading}>
        <h2 aria-live='polite'>{title}</h2>
        <p>{summary}</p>
      </div>
      <div className={css.controls}>
        {onToday ? (
          <Btn onClick={onToday} size='sm' type='button' variant='ghost'>
            {t({ en: 'Today', pl: 'Dzisiaj' })}
          </Btn>
        ) : null}
        <Btn
          aria-label={previousLabel}
          disabled={!onPrevious}
          icon={<ChevronLeftIcon aria-hidden='true' />}
          iconOnly
          onClick={onPrevious}
          size='sm'
          type='button'
          variant='ghost'
        />
        <Btn
          aria-label={nextLabel}
          disabled={!onNext}
          icon={<ChevronRightIcon aria-hidden='true' />}
          iconOnly
          onClick={onNext}
          size='sm'
          type='button'
          variant='ghost'
        />
      </div>
    </header>
  );
}

/** "3 workouts · 4h 20m" for the period on screen; empty until its data is known. */
export function usePeriodSummary(workouts: WorkoutSummary[] | undefined) {
  const { t } = useI18n();
  if (!workouts) return ' ';
  if (workouts.length === 0) return t({ en: 'No workouts', pl: 'Brak treningów' });
  const count = workouts.length;
  const { seconds } = totalsOf(workouts);
  const label = t({
    en: `${count} ${pluralEn(count, 'workout', 'workouts')}`,
    pl: `${count} ${pluralPl(count, 'trening', 'treningi', 'treningów')}`,
  });
  return seconds > 0 ? `${label} · ${formatCompactDuration(seconds)}` : label;
}
