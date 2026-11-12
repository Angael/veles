import { Link } from '@tanstack/react-router';
import {
  CalendarRangeIcon,
  FlameIcon,
  FlagIcon,
  HourglassIcon,
  RepeatIcon,
  SparklesIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { formatCompactDuration } from '../dashboard/calendar/calendarDates';
import type { Streak, WorkoutStats } from './stats.server';
import css from './WorkoutStats.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

const DAY_MONTH: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

/** Records and habits: streaks, favourite routine, the longest workout, and new exercises. */
export function StatsHighlights({ stats }: { stats: WorkoutStats }) {
  const { formatDate, t } = useI18n();
  const range = (streak: Streak) =>
    streak.from === streak.to
      ? formatDate(streak.from, DAY_MONTH)
      : `${formatDate(streak.from, DAY_MONTH)} – ${formatDate(streak.to, DAY_MONTH)}`;

  return (
    <section aria-labelledby='stats-highlights' className={css.highlights} data-appear='6'>
      <h2 id='stats-highlights'>{t({ en: 'Highlights', pl: 'Wyróżnienia' })}</h2>
      <ul>
        {stats.firstSession && (
          <Highlight
            icon={<FlagIcon aria-hidden='true' />}
            note={
              <Link params={{ id: stats.firstSession.id }} to='/workouts/$id'>
                {stats.firstSession.name}
              </Link>
            }
            title={t({ en: 'Where it started', pl: 'Pierwszy trening' })}
            value={formatDate(stats.firstSession.date, { ...DAY_MONTH, year: 'numeric' })}
          />
        )}
        {stats.weekStreak && (
          <Highlight
            icon={<CalendarRangeIcon aria-hidden='true' />}
            note={range(stats.weekStreak)}
            title={t({ en: 'Longest weekly streak', pl: 'Najdłuższa seria tygodni' })}
            value={t({
              en: `${stats.weekStreak.length} ${pluralEn(stats.weekStreak.length, 'week', 'weeks')}`,
              pl: `${stats.weekStreak.length} ${pluralPl(stats.weekStreak.length, 'tydzień', 'tygodnie', 'tygodni')}`,
            })}
          />
        )}
        {stats.dayStreak && stats.dayStreak.length > 1 && (
          <Highlight
            icon={<FlameIcon aria-hidden='true' />}
            note={range(stats.dayStreak)}
            title={t({ en: 'Days in a row', pl: 'Dni z rzędu' })}
            value={t({
              en: `${stats.dayStreak.length} days`,
              pl: `${stats.dayStreak.length} ${pluralPl(stats.dayStreak.length, 'dzień', 'dni', 'dni')}`,
            })}
          />
        )}
        {stats.favouriteRoutine && (
          <Highlight
            icon={<RepeatIcon aria-hidden='true' />}
            note={t({
              en: `Done ${stats.favouriteRoutine.sessions} ${pluralEn(stats.favouriteRoutine.sessions, 'time', 'times')}`,
              pl: `Wykonany ${stats.favouriteRoutine.sessions} ${pluralPl(stats.favouriteRoutine.sessions, 'raz', 'razy', 'razy')}`,
            })}
            title={t({ en: 'Favourite routine', pl: 'Ulubiony plan' })}
            value={
              <Link params={{ id: stats.favouriteRoutine.id }} to='/workouts/routines/$id'>
                {stats.favouriteRoutine.name}
              </Link>
            }
          />
        )}
        {stats.longestSession && (
          <Highlight
            icon={<HourglassIcon aria-hidden='true' />}
            note={
              <Link params={{ id: stats.longestSession.id }} to='/workouts/$id'>
                {stats.longestSession.name}, {formatDate(stats.longestSession.date, DAY_MONTH)}
              </Link>
            }
            title={t({ en: 'Longest workout', pl: 'Najdłuższy trening' })}
            value={formatCompactDuration(stats.longestSession.seconds)}
          />
        )}
        <Highlight
          icon={<SparklesIcon aria-hidden='true' />}
          note={t({
            en: `${stats.exercises} different in total`,
            pl: `Łącznie ${stats.exercises} różnych`,
          })}
          title={t({ en: 'New exercises tried', pl: 'Nowe ćwiczenia' })}
          value={String(stats.newExercises)}
        />
      </ul>
    </section>
  );
}

type HighlightProps = { icon: ReactNode; note: ReactNode; title: string; value: ReactNode };

function Highlight({ icon, note, title, value }: HighlightProps) {
  return (
    <li className={css.highlight}>
      <span className={css.highlightTitle}>
        {icon}
        {title}
      </span>
      <strong>{value}</strong>
      <span className={css.hint}>{note}</span>
    </li>
  );
}
