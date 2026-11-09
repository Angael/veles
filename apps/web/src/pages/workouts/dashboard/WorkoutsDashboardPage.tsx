import { useSuspenseQuery } from '@tanstack/react-query';
import { RoutineList } from '../routines/RoutineList';
import { workoutsQueryOptions } from '../workouts.query';
import { WorkoutCalendar } from './calendar/WorkoutCalendar';
import { StartWorkoutMenu } from './StartWorkoutMenu';
import { WorkoutStats } from './WorkoutStats';
import css from './WorkoutsDashboardPage.module.css';

type WorkoutsDashboardPageProps = {
  initialDate: string | undefined;
  onDateChange: (date: string | undefined) => void;
};

/** Workouts home: the calendar first, then routines and headline numbers. */
export function WorkoutsDashboardPage({ initialDate, onDateChange }: WorkoutsDashboardPageProps) {
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());
  const active = workouts.find((workout) => workout.endedAt === null);

  return (
    <main className={css.page}>
      <WorkoutCalendar initialDate={initialDate} onDateChange={onDateChange} />
      <RoutineList />
      <WorkoutStats />
      <StartWorkoutMenu active={active} />
    </main>
  );
}
