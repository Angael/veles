import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { addDays, format, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { Card } from '@/components/ui/card/Card';
import { todayLocalDate } from '@/lib/dateOnly';
import type { CalendarDay } from './dashboard.api';
import { workoutCalendarQueryOptions } from './dashboard.query';
import css from './WorkoutCalendar.module.css';

const WEEKS = 26;
/** Full brightness from this much training in a day; longer days are usually a forgotten Finish. */
const FULL_SECONDS = 2 * 60 * 60;

/** Monday that starts the visible range, as `YYYY-MM-DD`. Shared with the route loader. */
export function calendarStart(today = todayLocalDate()) {
  const monday = startOfWeek(parseISO(today), { weekStartsOn: 1 });
  return format(subWeeks(monday, WEEKS - 1), 'yyyy-MM-dd');
}

/** 0 = no training, 1–4 = quarters of the two-hour scale. */
const levelOf = (seconds: number) =>
  seconds <= 0 ? 0 : Math.min(4, Math.ceil((Math.min(seconds, FULL_SECONDS) / FULL_SECONDS) * 4));

/**
 * Month name above the first week that holds the 1st of that month. Week 0 is labelled only if
 * no other label follows within two weeks, so "Apr May" never overlap.
 */
function monthLabels(start: string) {
  const labels = Array.from({ length: WEEKS }, (_, week) => {
    const sunday = addDays(parseISO(start), week * 7 + 6);
    return week === 0 || sunday.getDate() <= 7 ? format(sunday, 'MMM') : '';
  });
  if (labels[1] || labels[2]) labels[0] = '';
  return labels;
}

const formatMinutes = (seconds: number) =>
  seconds >= 3600
    ? `${Math.floor(seconds / 3600)} h ${Math.round((seconds % 3600) / 60)} min`
    : `${Math.round(seconds / 60)} min`;

/**
 * GitHub-style grid of the last 26 weeks: one column per week, Monday on top. Brighter squares
 * mean more training that day; tap a square to open that day's workout.
 */
export function WorkoutCalendar() {
  const today = todayLocalDate();
  const start = calendarStart(today);
  const { data } = useSuspenseQuery(workoutCalendarQueryOptions(start));
  const byDate = new Map(data.map((day) => [day.date, day]));
  const days = Array.from({ length: WEEKS * 7 }, (_, index) =>
    format(addDays(parseISO(start), index), 'yyyy-MM-dd'),
  );
  const totalSeconds = data.reduce((sum, day) => sum + day.seconds, 0);
  const trainingDays = data.filter((day) => day.date <= today).length;

  return (
    <Card as='section' aria-labelledby='workout-calendar-title' className={css.card}>
      <header className={css.header}>
        <h2 id='workout-calendar-title'>Last 6 months</h2>
        <p className={css.summary}>
          {trainingDays === 0
            ? 'No workouts yet'
            : `${trainingDays} ${trainingDays === 1 ? 'day' : 'days'} · ${formatMinutes(totalSeconds)}`}
        </p>
      </header>

      <div className={css.months} aria-hidden='true'>
        {monthLabels(start).map((label, week) => (
          <span key={week}>{label}</span>
        ))}
      </div>

      <ol aria-label='Training days' className={css.grid}>
        {days.map((date) => (
          <DaySquare date={date} day={byDate.get(date)} future={date > today} key={date} />
        ))}
      </ol>

      <div aria-hidden='true' className={css.legend}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <span className={clsx(css.square, css[`level${level}`])} key={level} />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
}

type DaySquareProps = { date: string; day: CalendarDay | undefined; future: boolean };

function DaySquare({ date, day, future }: DaySquareProps) {
  const label = `${format(parseISO(date), 'EEE dd.MM')} · ${
    day
      ? `${formatMinutes(day.seconds)}${day.workoutCount > 1 ? `, ${day.workoutCount} workouts` : ''}`
      : 'no workout'
  }`;
  const className = clsx(
    css.square,
    css[`level${levelOf(day?.seconds ?? 0)}`],
    future && css.future,
  );

  return (
    <li className={css.cell}>
      {day ? (
        <Link
          aria-label={label}
          className={className}
          params={{ id: day.workoutId }}
          title={label}
          to='/workouts/$id'
        />
      ) : (
        <span aria-label={future ? undefined : label} className={className} title={label} />
      )}
    </li>
  );
}
