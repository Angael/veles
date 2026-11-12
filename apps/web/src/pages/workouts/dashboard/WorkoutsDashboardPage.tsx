import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRightIcon, ListIcon } from 'lucide-react';
import { RoutineList } from '../routines/RoutineList';
import { workoutsQueryOptions } from '../workouts.query';
import { WorkoutCalendar } from './calendar/WorkoutCalendar';
import { StartWorkoutMenu } from './StartWorkoutMenu';
import css from './WorkoutsDashboardPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type WorkoutsDashboardPageProps = {
  initialDate: string | undefined;
  onDateChange: (date: string | undefined) => void;
};

/** Workouts home: the calendar first, then routines and the exercise list. */
export function WorkoutsDashboardPage({ initialDate, onDateChange }: WorkoutsDashboardPageProps) {
  const { t } = useI18n();
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());
  const active = workouts.find((workout) => workout.endedAt === null);

  return (
    <main className={css.page}>
      <WorkoutCalendar initialDate={initialDate} onDateChange={onDateChange} />
      <RoutineList />
      <Link className={css.exercisesLink} to='/workouts/exercises'>
        <ListIcon aria-hidden='true' />
        <span>
          <strong>{t({ en: 'Exercises', pl: 'Ćwiczenia' })}</strong>
          <span>
            {t({
              en: 'Rename, change tracking, or archive exercises',
              pl: 'Zmieniaj nazwy, pomiar lub archiwizuj ćwiczenia',
            })}
          </span>
        </span>
        <ChevronRightIcon aria-hidden='true' />
      </Link>
      <StartWorkoutMenu active={active} />
    </main>
  );
}
