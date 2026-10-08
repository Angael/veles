import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRightIcon, PlayIcon, PlusIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { todayLocalDate } from '@/lib/dateOnly';
import { RoutineList } from '../routines/RoutineList';
import { WorkoutList } from '../WorkoutList';
import { useStartWorkoutMutation, workoutsQueryOptions } from '../workouts.query';
import { ExerciseProgressList } from './ExerciseProgressList';
import { WorkoutCalendar } from './WorkoutCalendar';
import css from './WorkoutsDashboardPage.module.css';

const RECENT = 5;

/**
 * Workouts home: continue or start (empty or from a routine), the training calendar, recent
 * workouts and how each exercise is going.
 */
export function WorkoutsDashboardPage() {
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());
  const navigate = useNavigate();
  const startWorkout = useStartWorkoutMutation();
  const active = workouts.find((workout) => workout.endedAt === null);

  return (
    <main className={css.page}>
      <section aria-labelledby='start-title' className={css.section}>
        <h2 className={css.title} id='start-title'>
          Start
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
        <Btn
          className={css.empty}
          icon={<PlusIcon aria-hidden='true' />}
          loading={startWorkout.isPending}
          onClick={() =>
            startWorkout.mutate(
              { date: todayLocalDate() },
              { onSuccess: ({ id }) => void navigate({ params: { id }, to: '/workouts/$id' }) },
            )
          }
          radius='pill'
          variant={active ? 'outlineMain' : 'main'}
        >
          Empty workout
        </Btn>
        <h3 className={css.subtitle}>Routines</h3>
        <RoutineList />
      </section>

      <WorkoutCalendar />

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

      <ExerciseProgressList />
    </main>
  );
}
