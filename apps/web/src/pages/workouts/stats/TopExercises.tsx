import { Card } from '@/components/ui/card/Card';
import type { ExerciseStat } from './stats.server';
import css from './WorkoutStats.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

/** Favourite exercises ranked by how many workouts included them. */
export function TopExercises({ exercises }: { exercises: ExerciseStat[] }) {
  const { formatNumber, t } = useI18n();
  const [first] = exercises;
  if (!first) return null;
  const top = first.sessions;

  return (
    <Card as='section' className={css.section} data-appear='2'>
      <h2>{t({ en: 'Your top exercises', pl: 'Twoje ulubione ćwiczenia' })}</h2>
      <p className={css.lead}>
        {t({
          en: `${first.name} was in ${formatNumber(first.share, { style: 'percent' })} of your workouts.`,
          pl: `${first.name} – w ${formatNumber(first.share, { style: 'percent' })} Twoich treningów.`,
        })}
      </p>
      <ol className={css.ranking}>
        {exercises.map((exercise, index) => (
          <li
            key={exercise.id}
            style={{ backgroundSize: `${(exercise.sessions / top) * 100}% 100%` }}
          >
            <span className={css.rank}>{index + 1}</span>
            <span className={css.rankName}>{exercise.name}</span>
            <span className={css.rankCount}>
              {t({
                en: `${exercise.sessions} ${pluralEn(exercise.sessions, 'workout', 'workouts')}`,
                pl: `${exercise.sessions} ${pluralPl(exercise.sessions, 'trening', 'treningi', 'treningów')}`,
              })}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
