import { Link } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
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

/**
 * Workout rows that open the session; long press or right click to save as a routine or delete.
 * An open workout gets a highlighted, animated row with a live clock.
 */
export function WorkoutList({ workouts }: { workouts: WorkoutSummary[] }) {
  const deleteWorkout = useDeleteWorkoutMutation();
  const saveRoutine = useSaveRoutineFromWorkoutMutation();
  const [savingFrom, setSavingFrom] = useState<WorkoutSummary | null>(null);

  return (
    <>
      <ul aria-label='Workouts' className={css.list}>
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
              <ContextMenuPopup aria-label={`${workout.name} actions`}>
                <ContextMenuItem
                  disabled={workout.exerciseCount === 0}
                  icon={<BookmarkPlusIcon aria-hidden='true' />}
                  label='Save as routine'
                  onClick={() => setSavingFrom(workout)}
                />
                <ContextMenuItem
                  icon={<Trash2Icon aria-hidden='true' />}
                  label='Delete workout'
                  onClick={() => {
                    if (window.confirm(`Delete “${workout.name}” and its sets?`)) {
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
        submitLabel='Save routine'
        title='Save as routine'
      />
    </>
  );
}

function WorkoutRow({ workout }: { workout: WorkoutSummary }) {
  const open = workout.endedAt === null;
  const duration =
    workout.startedAt && workout.endedAt
      ? (Date.parse(workout.endedAt) - Date.parse(workout.startedAt)) / 1000
      : null;

  return (
    <Card as='article' className={clsx(css.row, open && css.open)}>
      <div className={css.text}>
        <p className={css.top}>
          <time className={css.date} dateTime={workout.date}>
            {format(parseISO(workout.date), 'EEE dd.MM')}
          </time>
          {open ? <span className={css.live}>In progress</span> : null}
        </p>
        <h3>{workout.name}</h3>
        <p className={css.meta}>
          {open && workout.startedAt ? <ElapsedTime startedAt={workout.startedAt} /> : null}
          {duration === null ? null : <span>{formatElapsed(duration)}</span>}
          <span>
            {workout.exerciseCount} {workout.exerciseCount === 1 ? 'exercise' : 'exercises'}
          </span>
          <span>{workout.doneSets} sets</span>
          {workout.volumeKg > 0 ? <span>{workout.volumeKg.toLocaleString()} kg</span> : null}
        </p>
      </div>
      {open ? <ArrowRightIcon aria-hidden='true' className={css.arrow} /> : null}
    </Card>
  );
}
