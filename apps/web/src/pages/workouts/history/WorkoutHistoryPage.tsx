import { useSuspenseQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card/Card';
import { WorkoutList } from '../WorkoutList';
import { workoutsQueryOptions } from '../workouts.query';
import css from './WorkoutHistoryPage.module.css';

/** Every logged workout, newest first. */
export function WorkoutHistoryPage() {
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());

  return (
    <main className={css.page}>
      {workouts.length === 0 ? (
        <Card as='section' className={css.empty}>
          <h1>No workouts yet</h1>
        </Card>
      ) : (
        <WorkoutList workouts={workouts} />
      )}
    </main>
  );
}
