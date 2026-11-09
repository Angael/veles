import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import { useState } from 'react';
import css from './Calendar.module.css';
import { MonthView } from './MonthView';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useTodayLocalDate } from '@/lib/useTodayLocalDate';

type WorkoutCalendarProps = {
  initialDate: string | undefined;
  onDateChange: (date: string | undefined) => void;
};

/** Holds the chosen day, which selects the month on screen. Without a choice it is today. */
export function WorkoutCalendar({ initialDate, onDateChange }: WorkoutCalendarProps) {
  const { t } = useI18n();
  const today = useTodayLocalDate();
  // Page numbers count from this day, so a new day at midnight does not renumber them.
  const [origin] = useState(today);
  const [picked, setPicked] = useState(initialDate ?? null);
  const anchor = picked ?? today;

  const select = (date: string) => {
    if (date === anchor) return;
    const next = date === today ? null : date;
    setPicked(next);
    onDateChange(next ?? undefined);
  };

  return (
    <section
      aria-label={t({ en: 'Workout calendar', pl: 'Kalendarz treningów' })}
      className={css.calendar}
      data-appear
    >
      <MonthView anchor={anchor} onSelect={select} origin={origin} today={today} />
      <Link className={css.more} to='/workouts/history'>
        {t({ en: 'All workouts', pl: 'Wszystkie treningi' })} <ArrowRightIcon aria-hidden='true' />
      </Link>
    </section>
  );
}
