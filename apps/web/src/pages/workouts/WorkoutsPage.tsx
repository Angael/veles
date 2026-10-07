import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { PlayIcon, Trash2Icon } from 'lucide-react';
import { Card } from '@/components/ui/card/Card';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { todayLocalDate } from '@/lib/dateOnly';
import { formatDuration } from './metrics';
import type { WorkoutSummary } from './workouts.api';
import {
  useDeleteWorkoutMutation,
  useStartWorkoutMutation,
  workoutsQueryOptions,
} from './workouts.query';
import css from './WorkoutsPage.module.css';

/** Logged workouts, newest first; unfinished ones are marked so they are easy to continue. */
export function WorkoutsPage() {
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());
  const navigate = useNavigate();
  const startWorkout = useStartWorkoutMutation();
  const deleteWorkout = useDeleteWorkoutMutation();

  return (
    <main className={css.page}>
      {workouts.length === 0 ? (
        <Card as='section' className={css.empty}>
          <h1>No workouts yet</h1>
          <p>Start one when you get to the gym. Every set saves as you tick it.</p>
        </Card>
      ) : (
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
                    icon={<Trash2Icon aria-hidden='true' />}
                    label='Delete workout'
                    onClick={() => deleteWorkout.mutate({ id: workout.id })}
                    variant='danger'
                  />
                </ContextMenuPopup>
              </ContextMenuRoot>
            </li>
          ))}
        </ul>
      )}

      <FloatingButton
        icon={<PlayIcon aria-hidden='true' />}
        loading={startWorkout.isPending}
        onClick={() =>
          startWorkout.mutate(
            { date: todayLocalDate() },
            { onSuccess: ({ id }) => void navigate({ params: { id }, to: '/workouts/$id' }) },
          )
        }
      >
        Start workout
      </FloatingButton>
    </main>
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
      <h2>{workout.name}</h2>
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
