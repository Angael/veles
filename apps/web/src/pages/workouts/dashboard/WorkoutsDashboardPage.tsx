import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRightIcon, LoaderCircleIcon, PlayIcon, PlusIcon } from 'lucide-react';
import { todayLocalDate } from '@/lib/dateOnly';
import { RoutineList } from '../routines/RoutineList';
import { WorkoutList } from '../WorkoutList';
import { useStartWorkoutMutation, workoutsQueryOptions } from '../workouts.query';
import { ExerciseProgressList } from './ExerciseProgressList';
import { WorkoutCalendar } from './WorkoutCalendar';
import css from './WorkoutsDashboardPage.module.css';

const RECENT = 5;

/**
 * Workouts home: continue or start (empty or from a routine) and recent workouts in the main
 * column; the training calendar and how each exercise is going on the side.
 */
export function WorkoutsDashboardPage() {
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());
  const active = workouts.find((workout) => workout.endedAt === null);

  return (
    <main className={css.page}>
      <div className={css.main}>
        <section aria-label='Start a workout' className={css.section}>
          {active ? (
            <Link className={css.continue} params={{ id: active.id }} to='/workouts/$id'>
              <PlayIcon aria-hidden='true' />
              <span>
                Continue <strong>{active.name}</strong>
                <small>
                  {active.doneSets} sets · {active.exerciseCount} exercises
                </small>
              </span>
              <ArrowRightIcon aria-hidden='true' />
            </Link>
          ) : null}
          <RoutineList startBlocked={active !== undefined}>
            {active ? null : <EmptyWorkoutTile />}
          </RoutineList>
        </section>

        {workouts.length > 0 ? (
          <section aria-labelledby='recent-title' className={css.section}>
            <h2 className={css.title} id='recent-title'>
              Recent workouts
            </h2>
            <WorkoutList workouts={workouts.slice(0, RECENT)} />
            {workouts.length > RECENT ? (
              <Link className={css.more} to='/workouts/history'>
                All workouts <ArrowRightIcon aria-hidden='true' />
              </Link>
            ) : null}
          </section>
        ) : null}
      </div>

      <div className={css.side}>
        <WorkoutCalendar />
        <ExerciseProgressList />
      </div>
    </main>
  );
}

/** First start tile: a blank workout, styled as a dashed sibling of the routine tiles. */
function EmptyWorkoutTile() {
  const navigate = useNavigate();
  const startWorkout = useStartWorkoutMutation();

  return (
    <li>
      <button
        aria-busy={startWorkout.isPending}
        className={css.emptyTile}
        onClick={() =>
          !startWorkout.isPending &&
          startWorkout.mutate(
            { date: todayLocalDate() },
            { onSuccess: ({ id }) => void navigate({ params: { id }, to: '/workouts/$id' }) },
          )
        }
        type='button'
      >
        <span className={css.emptyIcon}>
          {startWorkout.isPending ? (
            <LoaderCircleIcon aria-hidden='true' className={css.spin} />
          ) : (
            <PlusIcon aria-hidden='true' />
          )}
        </span>
        <span className={css.emptyText}>
          <strong>Empty workout</strong>
          <small>Add exercises as you go</small>
        </span>
      </button>
    </li>
  );
}
