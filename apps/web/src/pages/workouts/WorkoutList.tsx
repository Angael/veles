import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { ArrowRightIcon, BookmarkPlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { ElapsedTime, formatElapsed } from './ElapsedTime';
import { RoutineDialog } from './routines/RoutineDialog';
import { useSaveRoutineFromWorkoutMutation } from './routines/routines.query';
import type { WorkoutSummary } from './workouts.api';
import { useDeleteWorkoutMutation } from './workouts.query';
import css from './WorkoutList.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';
import { daysAgo, formatDaysAgo } from '@/lib/relativeDay';

/**
 * Workout rows that open the session; long press or right click to save as a routine or delete.
 * An open workout gets a highlighted, animated row with a live clock.
 */
export function WorkoutList({ workouts }: { workouts: WorkoutSummary[] }) {
  const { t } = useI18n();
  const deleteWorkout = useDeleteWorkoutMutation();
  const saveRoutine = useSaveRoutineFromWorkoutMutation();
  const [savingFrom, setSavingFrom] = useState<WorkoutSummary | null>(null);

  return (
    <>
      <ul aria-label={t({ en: 'Workouts', pl: 'Treningi' })} className={css.list}>
        {workouts.map((workout) => (
          <li key={workout.id}>
            <ContextMenuRoot>
              <ContextMenuTrigger
                render={
                  <Link className={css.link} params={{ id: workout.id }} to='/workouts/$id' />
                }
              >
                <WorkoutRow workout={workout} />
              </ContextMenuTrigger>
              <ContextMenuPopup
                aria-label={t({ en: `${workout.name} actions`, pl: `Akcje: ${workout.name}` })}
              >
                <ContextMenuItem
                  disabled={workout.exerciseCount === 0}
                  icon={<BookmarkPlusIcon aria-hidden='true' />}
                  label={t({ en: 'Save as routine', pl: 'Zapisz jako plan' })}
                  onClick={() => setSavingFrom(workout)}
                />
                <ContextMenuItem
                  icon={<Trash2Icon aria-hidden='true' />}
                  label={t({ en: 'Delete workout', pl: 'Usuń trening' })}
                  onClick={() => {
                    if (
                      window.confirm(
                        t({
                          en: `Delete “${workout.name}” and its sets?`,
                          pl: `Usunąć „${workout.name}” razem z seriami?`,
                        }),
                      )
                    ) {
                      deleteWorkout.mutate({ id: workout.id });
                    }
                  }}
                  variant='danger'
                />
              </ContextMenuPopup>
            </ContextMenuRoot>
          </li>
        ))}
      </ul>
      <RoutineDialog
        defaults={{ description: '', name: savingFrom?.name ?? '' }}
        key={savingFrom?.id}
        onOpenChange={(open) => !open && setSavingFrom(null)}
        onSubmit={(values) =>
          savingFrom
            ? saveRoutine.mutateAsync({ ...values, workoutId: savingFrom.id })
            : Promise.resolve()
        }
        open={savingFrom !== null}
        pending={saveRoutine.isPending}
        submitLabel={t({ en: 'Save routine', pl: 'Zapisz plan' })}
        title={t({ en: 'Save as routine', pl: 'Zapisz jako plan' })}
      />
    </>
  );
}

function WorkoutRow({ workout }: { workout: WorkoutSummary }) {
  const { formatNumber, t } = useI18n();
  const open = workout.endedAt === null;

  return (
    <Card as='article' className={clsx(css.row, open && css.open)}>
      <div className={css.text}>
        <p className={css.top}>
          <WorkoutDate date={workout.date} />
          {open ? (
            <span className={css.live}>{t({ en: 'In progress', pl: 'W trakcie' })}</span>
          ) : null}
        </p>
        <h3>{workout.name}</h3>
        <p className={css.meta}>
          {open && workout.startedAt ? <ElapsedTime startedAt={workout.startedAt} /> : null}
          {workout.durationSeconds === null ? null : (
            <span>{formatElapsed(workout.durationSeconds)}</span>
          )}
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
      </div>
      {open ? <ArrowRightIcon aria-hidden='true' className={css.arrow} /> : null}
    </Card>
  );
}

/** Days further away than this show only the weekday and date; a relative label adds noise. */
const RELATIVE_DAYS = 6;

/**
 * "Monday, 2026-10-19 · 3 days ago": the weekday and an unambiguous ISO date, plus a relative
 * label for the past week so recent sessions read at a glance.
 */
function WorkoutDate({ date }: { date: string }) {
  const i18n = useI18n();
  const weekday = i18n.formatDate(date, { weekday: 'long' });
  const relative = Math.abs(daysAgo(date)) <= RELATIVE_DAYS ? formatDaysAgo(date, i18n) : null;

  return (
    <time className={css.date} dateTime={date}>
      <span className={css.weekday}>{weekday.charAt(0).toUpperCase() + weekday.slice(1)}</span>
      {`, ${date}`}
      {relative ? <span className={css.relative}>{` · ${relative}`}</span> : null}
    </time>
  );
}
