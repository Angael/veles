import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ArrowRightIcon } from 'lucide-react';
import { RoutineList } from '../routines/RoutineList';
import { WorkoutList } from '../WorkoutList';
import { workoutsQueryOptions } from '../workouts.query';
import { StartWorkoutMenu } from './StartWorkoutMenu';
import { WorkoutCalendar } from './WorkoutCalendar';
import { WorkoutStats } from './WorkoutStats';
import css from './WorkoutsDashboardPage.module.css';

const RECENT = 10;

/**
 * Workouts home: one list with the open workout (highlighted) on top and recent ones below; the
 * calendar, stats and routines on the side. Starting lives in the floating menu.
 */
export function WorkoutsDashboardPage() {
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());
  const active = workouts.find((workout) => workout.endedAt === null);
  const shown = [
    ...(active ? [active] : []),
    ...workouts.filter((workout) => workout !== active).slice(0, RECENT),
  ];

  return (
    <main className={css.page}>
      <section aria-label='Workouts' className={css.main}>
        {shown.length > 0 ? (
          <WorkoutList workouts={shown} />
        ) : (
          <p className={css.hint}>No workouts yet. Start one with the button below.</p>
        )}
        {workouts.length > shown.length ? (
          <Link className={css.more} to='/workouts/history'>
            All workouts <ArrowRightIcon aria-hidden='true' />
          </Link>
        ) : null}
      </section>

      <div className={css.side}>
        <WorkoutCalendar />
        <WorkoutStats />
        <RoutineList />
      </div>

      <StartWorkoutMenu active={active} />
    </main>
  );
}
