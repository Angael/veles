import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRightIcon, PlayIcon } from 'lucide-react';
import { RoutineList } from '../routines/RoutineList';
import { WorkoutList } from '../WorkoutList';
import { workoutsQueryOptions } from '../workouts.query';
import { StartWorkoutMenu } from './StartWorkoutMenu';
import { WorkoutCalendar } from './WorkoutCalendar';
import { WorkoutStats } from './WorkoutStats';
import css from './WorkoutsDashboardPage.module.css';

const RECENT = 10;

/**
 * Workouts home: the open workout and routines, then recent workouts in the main column; the
 * training calendar and stats on the side. Starting lives in the floating menu.
 */
export function WorkoutsDashboardPage() {
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());
  const active = workouts.find((workout) => workout.endedAt === null);

  return (
    <main className={css.page}>
      <div className={css.main}>
        <section aria-labelledby='current-title' className={css.section}>
          <h2 className={css.title} id='current-title'>
            Current workouts
          </h2>
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
          <RoutineList startBlocked={active !== undefined} />
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
        <WorkoutStats />
      </div>

      <StartWorkoutMenu active={active} />
    </main>
  );
}
