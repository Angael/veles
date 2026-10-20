import { useQuery } from '@tanstack/react-query';
import {
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { exerciseHistoryQueryOptions } from '../exercises/exercises.query';
import css from './ExerciseNotes.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { SHORT_DAY } from '../metrics';

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
  const { formatDate, t } = useI18n();
  const history = useQuery({
    ...exerciseHistoryQueryOptions(exerciseId, workoutId),
    enabled: open,
  });
  const entries = history.data ?? [];

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>{exerciseName}</DialogTitle>
        {history.isPending ? (
          <DialogDescription>{t({ en: 'Loading…', pl: 'Wczytywanie…' })}</DialogDescription>
        ) : null}
        {history.isError ? (
          <DialogDescription>
            {t({ en: 'Could not load history.', pl: 'Nie udało się wczytać historii.' })}
          </DialogDescription>
        ) : null}
        {history.isSuccess && entries.length === 0 ? (
          <DialogDescription>
            {t({ en: 'No earlier sessions yet.', pl: 'Brak wcześniejszych treningów.' })}
          </DialogDescription>
        ) : null}
        <ol className={css.history}>
          {entries.map((entry) => (
            <li className={css.historyEntry} key={entry.id}>
              <span
                className={css.position}
                title={t({
                  en: `Exercise ${entry.position} of ${entry.exerciseCount} in that workout`,
                  pl: `Ćwiczenie ${entry.position} z ${entry.exerciseCount} w tym treningu`,
                })}
              >
                #{entry.position}
                <small>
                  {t({ en: `of ${entry.exerciseCount}`, pl: `z ${entry.exerciseCount}` })}
                </small>
              </span>
              <div className={css.historyBody}>
                <span className={css.historyMeta}>
                  {formatDate(entry.date, SHORT_DAY)} · {entry.workoutName}
                </span>
                <span className={css.historySets}>
                  {entry.sets.length > 0
                    ? entry.sets.join('  ')
                    : t({ en: 'No sets done', pl: 'Brak wykonanych serii' })}
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
