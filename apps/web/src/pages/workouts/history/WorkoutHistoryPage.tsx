import { useSuspenseQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card/Card';
import { WorkoutList } from '../WorkoutList';
import { workoutsQueryOptions } from '../workouts.query';
import css from './WorkoutHistoryPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** Every logged workout, newest first. */
export function WorkoutHistoryPage() {
  const { t } = useI18n();
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());

  return (
    <main className={css.page}>
      {workouts.length === 0 ? (
        <Card as='section' className={css.empty}>
          <h1>{t({ en: 'No workouts yet', pl: 'Brak treningów' })}</h1>
        </Card>
      ) : (
        <WorkoutList workouts={workouts} />
      )}
    </main>
  );
}
