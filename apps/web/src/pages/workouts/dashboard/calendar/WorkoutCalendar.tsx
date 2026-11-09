import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import { useState } from 'react';
import css from './Calendar.module.css';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useTodayLocalDate } from '@/lib/useTodayLocalDate';

type WorkoutCalendarProps = {
  initialDate: string | undefined;
  onDateChange: (date: string | undefined) => void;
};

/**
 * Month grid on wider screens, swipeable week on phones. CSS picks the view, so the server renders
 * the right one without a layout flash. One chosen day drives both; without a choice it is today.
 */
export function WorkoutCalendar({ initialDate, onDateChange }: WorkoutCalendarProps) {
  const { t } = useI18n();
  const today = useTodayLocalDate();
  // Page numbers count from this day, so a new day at midnight does not renumber them.
  const [origin] = useState(today);
  const [picked, setPicked] = useState(initialDate ?? null);
  const anchor = picked ?? today;
  const view = {
    anchor,
    onSelect: (date: string) => {
      if (date === anchor) return;
      const next = date === today ? null : date;
      setPicked(next);
      onDateChange(next ?? undefined);
    },
    origin,
    today,
  };

  return (
    <section
      aria-label={t({ en: 'Workout calendar', pl: 'Kalendarz treningów' })}
      className={css.calendar}
      data-appear
    >
      <MonthView {...view} />
      <WeekView {...view} />
      <Link className={css.more} to='/workouts/history'>
        {t({ en: 'All workouts', pl: 'Wszystkie treningi' })} <ArrowRightIcon aria-hidden='true' />
      </Link>
    </section>
  );
}
