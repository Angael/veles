import { useSuspenseQuery } from '@tanstack/react-query';
import { format, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { todayLocalDate } from '@/lib/dateOnly';
import type { WorkoutSummary } from '../workouts.api';
import { workoutsQueryOptions } from '../workouts.query';
import css from './WorkoutStats.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';

const weekOf = (date: string) =>
  format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), 'yyyy-MM-dd');

const formatLength = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
};

/**
 * Headline numbers from the workout list: this week, this month, the run of weeks with at least
 * one workout, and the average length of finished workouts. The current week does not break the
 * streak until it is over.
 */
function computeStats(workouts: WorkoutSummary[], today: string) {
  const thisWeek = weekOf(today);
  const thisMonth = today.slice(0, 7);
  const weeks = new Set(workouts.map((workout) => weekOf(workout.date)));

  let streak = 0;
  let week = parseISO(
    weeks.has(thisWeek) ? thisWeek : format(subWeeks(parseISO(thisWeek), 1), 'yyyy-MM-dd'),
  );
  while (weeks.has(format(week, 'yyyy-MM-dd'))) {
    streak += 1;
    week = subWeeks(week, 1);
  }

  const lengths = workouts.flatMap((workout) =>
    workout.durationSeconds === null ? [] : [workout.durationSeconds],
  );

  return {
    averageSeconds: lengths.length
      ? lengths.reduce((sum, value) => sum + value, 0) / lengths.length
      : null,
    monthCount: workouts.filter((workout) => workout.date.startsWith(thisMonth)).length,
    streak,
    weekCount: workouts.filter((workout) => weekOf(workout.date) === thisWeek).length,
    weekSets: workouts
      .filter((workout) => weekOf(workout.date) === thisWeek)
      .reduce((sum, workout) => sum + workout.doneSets, 0),
  };
}

/** 2×2 grid of headline numbers beside the calendar. */
export function WorkoutStats() {
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());
  const stats = computeStats(workouts, todayLocalDate());
  const { t } = useI18n();
  const workoutCount = (count: number) =>
    t({
      en: `${count} ${pluralEn(count, 'workout', 'workouts')}`,
      pl: `${count} ${pluralPl(count, 'trening', 'treningi', 'treningów')}`,
    });

  return (
    <dl
      aria-label={t({ en: 'Workout stats', pl: 'Statystyki treningów' })}
      className={css.grid}
      data-appear='2'
    >
      <div>
        <dt>{t({ en: 'This week', pl: 'Ten tydzień' })}</dt>
        <dd>{workoutCount(stats.weekCount)}</dd>
        <dd className={css.sub}>
          {t({
            en: `${stats.weekSets} ${pluralEn(stats.weekSets, 'set', 'sets')}`,
            pl: `${stats.weekSets} ${pluralPl(stats.weekSets, 'seria', 'serie', 'serii')}`,
          })}
        </dd>
      </div>
      <div>
        <dt>{t({ en: 'This month', pl: 'Ten miesiąc' })}</dt>
        <dd>{workoutCount(stats.monthCount)}</dd>
      </div>
      <div>
        <dt>{t({ en: 'Streak', pl: 'Seria' })}</dt>
        <dd>
          {t({
            en: `${stats.streak} ${pluralEn(stats.streak, 'week', 'weeks')}`,
            pl: `${stats.streak} ${pluralPl(stats.streak, 'tydzień', 'tygodnie', 'tygodni')}`,
          })}
        </dd>
        <dd className={css.sub}>{t({ en: 'with a workout', pl: 'z treningiem' })}</dd>
      </div>
      <div>
        <dt>{t({ en: 'Average length', pl: 'Średni czas' })}</dt>
        <dd>{stats.averageSeconds === null ? '—' : formatLength(stats.averageSeconds)}</dd>
      </div>
    </dl>
  );
}
