import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { ArrowRightIcon } from 'lucide-react';
import { Card } from '@/components/ui/card/Card';
import { ElapsedTime, formatElapsed } from './ElapsedTime';
import { WorkoutBreakdown } from './WorkoutBreakdown';
import { WorkoutContextMenu } from './WorkoutContextMenu';
import type { WorkoutSummary } from './workouts.server';
import css from './WorkoutList.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';
import { daysAgo, formatDaysAgo } from '@/lib/relativeDay';

type WorkoutListProps = {
  workouts: WorkoutSummary[];
  /** Also list each workout's exercises and sets; for short lists such as one day. */
  detailed?: boolean;
};

/**
 * Workout rows that open the session; long press or right click to save as a routine or delete.
 * An open workout gets a highlighted, animated row with a live clock.
 */
export function WorkoutList({ detailed = false, workouts }: WorkoutListProps) {
  const { t } = useI18n();

  return (
    <ul aria-label={t({ en: 'Workouts', pl: 'Treningi' })} className={css.list}>
      {workouts.map((workout) => (
        <li key={workout.id}>
          <WorkoutContextMenu
            trigger={<Link className={css.link} params={{ id: workout.id }} to='/workouts/$id' />}
            workout={workout}
          >
            <WorkoutRow detailed={detailed} workout={workout} />
          </WorkoutContextMenu>
        </li>
      ))}
    </ul>
  );
}

function WorkoutRow({ detailed, workout }: { detailed: boolean; workout: WorkoutSummary }) {
  const { formatNumber, t } = useI18n();
  const open = workout.endedAt === null;

  return (
    <Card
      as='article'
      className={clsx(css.row, open && css.open, detailed && css.detailed)}
      data-open={open || undefined}
    >
      <div className={css.text}>
        <p className={css.top}>
          <WorkoutDate date={workout.date} relative={!detailed} />
          {detailed ? <WorkoutDuration workout={workout} /> : null}
          {open ? (
            <span className={css.live}>{t({ en: 'In progress', pl: 'W trakcie' })}</span>
          ) : null}
        </p>
        <h3>{workout.name}</h3>
        {detailed ? (
          <WorkoutBreakdown workoutId={workout.id} />
        ) : (
          <p className={css.meta}>
            <WorkoutDuration workout={workout} />
            <span>
              {t({
                en: `${workout.exerciseCount} ${pluralEn(workout.exerciseCount, 'exercise', 'exercises')}`,
                pl: `${workout.exerciseCount} ${pluralPl(workout.exerciseCount, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń')}`,
              })}
            </span>
            <span>
              {t({
                en: `${workout.doneSets} sets`,
                pl: `${workout.doneSets} ${pluralPl(workout.doneSets, 'seria', 'serie', 'serii')}`,
              })}
            </span>
            {workout.volumeKg > 0 ? <span>{formatNumber(workout.volumeKg)} kg</span> : null}
          </p>
        )}
      </div>
      {open ? <ArrowRightIcon aria-hidden='true' className={css.arrow} /> : null}
    </Card>
  );
}

/** Live clock while the workout runs, its final length once finished. */
function WorkoutDuration({ workout }: { workout: WorkoutSummary }) {
  if (workout.endedAt === null) {
    return workout.startedAt ? <ElapsedTime startedAt={workout.startedAt} /> : null;
  }
  return workout.durationSeconds === null ? null : (
    <span className={css.duration}>{formatElapsed(workout.durationSeconds)}</span>
  );
}

/** Days further away than this show only the weekday and date; a relative label adds noise. */
const RELATIVE_DAYS = 6;

/**
 * "Monday, 2026-10-19 · 3 days ago": the weekday and an unambiguous ISO date, plus a relative
 * label for the past week so recent sessions read at a glance.
 */
function WorkoutDate({ date, relative: withRelative }: { date: string; relative: boolean }) {
  const i18n = useI18n();
  const weekday = i18n.formatDate(date, { weekday: 'long' });
  const relative =
    withRelative && Math.abs(daysAgo(date)) <= RELATIVE_DAYS ? formatDaysAgo(date, i18n) : null;

  return (
    <time className={css.date} dateTime={date}>
      <span className={css.weekday}>{weekday.charAt(0).toUpperCase() + weekday.slice(1)}</span>
      {`, ${date}`}
      {relative ? <span className={css.relative}>{` · ${relative}`}</span> : null}
    </time>
  );
}
