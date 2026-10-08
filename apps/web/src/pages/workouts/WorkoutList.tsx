import { Link } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { BookmarkPlusIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card/Card';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { formatDuration } from './metrics';
import { RoutineDialog } from './routines/RoutineDialog';
import { useSaveRoutineFromWorkoutMutation } from './routines/routines.query';
import type { WorkoutSummary } from './workouts.api';
import { useDeleteWorkoutMutation } from './workouts.query';
import css from './WorkoutList.module.css';

/** Workout rows that open the session; long press or right click to save as a routine or delete. */
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
  const duration =
    workout.startedAt && workout.endedAt
      ? (Date.parse(workout.endedAt) - Date.parse(workout.startedAt)) / 1000
      : null;

  return (
    <Card as='article' className={css.row}>
      <time className={css.date} dateTime={workout.date}>
        {format(parseISO(workout.date), 'EEE dd.MM')}
      </time>
      <h3>{workout.name}</h3>
      <p className={css.meta}>
        {workout.endedAt ? null : <span className={css.live}>In progress</span>}
        {duration === null ? null : <span>{formatDuration(duration)}</span>}
        <span>
          {workout.exerciseCount} {workout.exerciseCount === 1 ? 'exercise' : 'exercises'}
        </span>
        <span>{workout.doneSets} sets</span>
        {workout.volumeKg > 0 ? <span>{workout.volumeKg.toLocaleString()} kg</span> : null}
      </p>
    </Card>
  );
}
