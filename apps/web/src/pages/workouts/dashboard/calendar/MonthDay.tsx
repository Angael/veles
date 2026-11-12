import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { WorkoutContextMenu } from '../../WorkoutContextMenu';
import type { WorkoutSummary } from '../../workouts.server';
import calendarCss from './Calendar.module.css';
import { formatCompactDuration, heatLevel, sameMonth, totalsOf } from './calendarDates';
import css from './MonthView.module.css';
import { type I18n, useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

const shortExercises = (count: number, t: I18n['t']) =>
  t({ en: `${count} ex.`, pl: `${count} ćw.` });

type MonthDayProps = {
  date: string;
  month: string;
  onSelect: (date: string) => void;
  selected: boolean;
  today: boolean;
  workouts: WorkoutSummary[];
};

/**
 * One day of the grid. CSS picks the content: named workout blocks on wide screens; on phones a
 * tile with the day's totals, under a button covering the cell that selects the day.
 */
export function MonthDay({ date, month, onSelect, selected, today, workouts }: MonthDayProps) {
  const { formatDate, t } = useI18n();
  const { exercises, open, seconds } = totalsOf(workouts);
  const duration = seconds > 0 ? formatCompactDuration(seconds) : null;
  const label = [
    formatDate(date, { day: 'numeric', month: 'long', weekday: 'long' }),
    workouts.length > 0
      ? t({
          en: `${exercises} ${pluralEn(exercises, 'exercise', 'exercises')}`,
          pl: `${exercises} ${pluralPl(exercises, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}`,
        })
      : null,
    duration,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <li
      className={clsx(
        css.day,
        !sameMonth(date, month) && css.outside,
        today && css.today,
        selected && css.selected,
      )}
    >
      <time dateTime={date}>{Number(date.slice(8))}</time>
      {workouts.map((workout) => (
        <WorkoutBlock key={workout.id} workout={workout} />
      ))}
      {workouts.length > 0 ? (
        <span
          className={clsx(
            css.tile,
            calendarCss[`level${heatLevel(seconds)}`],
            open && calendarCss.live,
          )}
        >
          <strong>{shortExercises(exercises, t)}</strong>
          {duration ? <span>{duration}</span> : null}
        </span>
      ) : null}
      <button
        aria-label={label}
        aria-pressed={selected}
        className={css.tap}
        onClick={() => onSelect(date)}
        type='button'
      />
    </li>
  );
}

function WorkoutBlock({ workout }: { workout: WorkoutSummary }) {
  const { t } = useI18n();
  const open = workout.endedAt === null;
  const seconds = workout.durationSeconds ?? 0;

  return (
    <WorkoutContextMenu
      trigger={
        <Link
          className={clsx(
            css.block,
            calendarCss[`level${heatLevel(seconds)}`],
            open && calendarCss.live,
          )}
          params={{ id: workout.id }}
          title={workout.name}
          to='/workouts/$id'
        />
      }
      workout={workout}
    >
      <strong>{workout.name}</strong>
      <span>
        {open
          ? t({ en: 'In progress', pl: 'W trakcie' })
          : [
              shortExercises(workout.exerciseCount, t),
              seconds > 0 ? formatCompactDuration(seconds) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
      </span>
    </WorkoutContextMenu>
  );
}
