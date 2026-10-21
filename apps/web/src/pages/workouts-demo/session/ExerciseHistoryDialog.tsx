import {
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { historyFor } from '../mockData';
import css from './ExerciseNotes.module.css';

type ExerciseHistoryDialogProps = {
  exerciseName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Past sessions of one exercise. The "#1 of 5" badge shows where it sat in that workout, which
 * often explains a good or bad day better than the numbers do.
 */
export function ExerciseHistoryDialog({
  exerciseName,
  onOpenChange,
  open,
}: ExerciseHistoryDialogProps) {
  const entries = historyFor(exerciseName);

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>{exerciseName}</DialogTitle>
        {entries.length === 0 ? (
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
                  {entry.date} · {entry.workoutName}
                </span>
                <span className={css.historySets}>{entry.sets.join('  ')}</span>
                {entry.note ? <p className={css.historyNote}>{entry.note}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </DialogPopup>
    </DialogRoot>
  );
}
