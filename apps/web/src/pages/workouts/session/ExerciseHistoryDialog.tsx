import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { exerciseHistoryQueryOptions } from '../exercises/exercises.query';
import css from './ExerciseNotes.module.css';

type ExerciseHistoryDialogProps = {
  exerciseId: string;
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The current workout, left out of its own history. */
  workoutId: string;
};

/**
 * Past sessions of one exercise. The "#1 of 5" badge shows where it sat in that workout, which
 * often explains a good or bad day better than the numbers do.
 */
export function ExerciseHistoryDialog({
  exerciseId,
  exerciseName,
  onOpenChange,
  open,
  workoutId,
}: ExerciseHistoryDialogProps) {
  const history = useQuery({
    ...exerciseHistoryQueryOptions(exerciseId, workoutId),
    enabled: open,
  });
  const entries = history.data ?? [];

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>{exerciseName}</DialogTitle>
        {history.isPending ? <DialogDescription>Loading…</DialogDescription> : null}
        {history.isError ? <DialogDescription>Could not load history.</DialogDescription> : null}
        {history.isSuccess && entries.length === 0 ? (
          <DialogDescription>No earlier sessions yet.</DialogDescription>
        ) : null}
        <ol className={css.history}>
          {entries.map((entry) => (
            <li className={css.historyEntry} key={entry.id}>
              <span
                className={css.position}
                title={`Exercise ${entry.position} of ${entry.exerciseCount} in that workout`}
              >
                #{entry.position}
                <small>of {entry.exerciseCount}</small>
              </span>
              <div className={css.historyBody}>
                <span className={css.historyMeta}>
                  {format(parseISO(entry.date), 'EEE dd.MM')} · {entry.workoutName}
                </span>
                <span className={css.historySets}>
                  {entry.sets.length > 0 ? entry.sets.join('  ') : 'No sets done'}
                </span>
                {entry.note ? <p className={css.historyNote}>{entry.note}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </DialogPopup>
    </DialogRoot>
  );
}
