import { useSuspenseQuery } from '@tanstack/react-query';
import { format, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { Card } from '@/components/ui/card/Card';
import { todayLocalDate } from '@/lib/dateOnly';
import type { WorkoutSummary } from '../workouts.api';
import { workoutsQueryOptions } from '../workouts.query';
import css from './WorkoutStats.module.css';

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
  const monthWorkouts = workouts.filter((workout) => workout.date.startsWith(thisMonth));

  let streak = 0;
  let week = parseISO(
    weeks.has(thisWeek) ? thisWeek : format(subWeeks(parseISO(thisWeek), 1), 'yyyy-MM-dd'),
  );
  while (weeks.has(format(week, 'yyyy-MM-dd'))) {
    streak += 1;
    week = subWeeks(week, 1);
  }

  const lengths = workouts.flatMap((workout) =>
    workout.startedAt && workout.endedAt
      ? [(Date.parse(workout.endedAt) - Date.parse(workout.startedAt)) / 1000]
      : [],
  );

  return {
    averageSeconds: lengths.length
      ? lengths.reduce((sum, value) => sum + value, 0) / lengths.length
      : null,
    monthCount: monthWorkouts.length,
    monthVolumeKg: monthWorkouts.reduce((sum, workout) => sum + workout.volumeKg, 0),
    streak,
    weekCount: workouts.filter((workout) => weekOf(workout.date) === thisWeek).length,
    weekSets: workouts
      .filter((workout) => weekOf(workout.date) === thisWeek)
      .reduce((sum, workout) => sum + workout.doneSets, 0),
  };
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** Small grid of headline numbers beside the calendar. */
export function WorkoutStats() {
  const { data: workouts } = useSuspenseQuery(workoutsQueryOptions());
  const stats = computeStats(workouts, todayLocalDate());

  return (
    <Card as='section' aria-labelledby='workout-stats-title' className={css.card}>
      <h2 id='workout-stats-title'>Stats</h2>
      <dl className={css.grid}>
        <div>
          <dt>This week</dt>
          <dd>{plural(stats.weekCount, 'workout')}</dd>
          <dd className={css.sub}>{plural(stats.weekSets, 'set')}</dd>
        </div>
        <div>
          <dt>This month</dt>
          <dd>{plural(stats.monthCount, 'workout')}</dd>
          {stats.monthVolumeKg > 0 ? (
            <dd className={css.sub}>{stats.monthVolumeKg.toLocaleString()} kg lifted</dd>
          ) : null}
        </div>
        <div>
          <dt>Streak</dt>
          <dd>{plural(stats.streak, 'week')}</dd>
          <dd className={css.sub}>with a workout</dd>
        </div>
        <div>
          <dt>Average length</dt>
          <dd>{stats.averageSeconds === null ? '—' : formatLength(stats.averageSeconds)}</dd>
        </div>
      </dl>
    </Card>
  );
}
