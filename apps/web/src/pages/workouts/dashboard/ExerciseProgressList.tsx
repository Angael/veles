import { useSuspenseQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Card } from '@/components/ui/card/Card';
import { formatDuration } from '../metrics';
import type { ExerciseProgress } from './dashboard.api';
import { exerciseProgressQueryOptions } from './dashboard.query';
import { Sparkline } from './Sparkline';
import css from './ExerciseProgressList.module.css';

const LIMIT = 8;

const formatValue = (exercise: ExerciseProgress, value: number) =>
  exercise.unit === 's' ? formatDuration(value) : `${value} ${exercise.unit}`;

/** Recently trained exercises: last session's best set and a trend of the best per session. */
export function ExerciseProgressList() {
  const { data } = useSuspenseQuery(exerciseProgressQueryOptions());
  const recent = data.toSorted((a, b) => b.lastDate.localeCompare(a.lastDate)).slice(0, LIMIT);
  if (recent.length === 0) return null;

  return (
    <Card as='section' aria-labelledby='exercise-progress-title' className={css.card}>
      <h2 id='exercise-progress-title'>Exercises</h2>
      <ul className={css.list}>
        {recent.map((exercise) => {
          const first = exercise.points[0];
          const last = exercise.points.at(-1);
          const trend =
            first && last
              ? `Best per session over ${exercise.points.length} sessions: ${formatValue(exercise, first.value)} to ${formatValue(exercise, last.value)}`
              : '';
          return (
            <li className={css.row} key={exercise.id}>
              <div className={css.text}>
                <span className={css.name}>{exercise.name}</span>
                <span className={css.meta}>
                  {exercise.lastBest} · {format(parseISO(exercise.lastDate), 'EEE dd.MM')}
                </span>
              </div>
              <Sparkline label={trend} values={exercise.points.map((point) => point.value)} />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
