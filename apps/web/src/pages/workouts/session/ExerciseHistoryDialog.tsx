import { useQuery } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { exerciseHistoryQueryOptions } from '../exercises/exercises.query';
import type { Measure } from '../metrics';
import { ExerciseHistoryEntry } from './ExerciseHistoryEntry';
import css from './ExerciseHistory.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type ExerciseHistoryDialogProps = {
  exerciseId: string;
  exerciseName: string;
  /** Current tracking, which decides the units and the order values are listed in. */
  measure: Measure;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The current workout, left out of its own history. */
  workoutId?: string;
};

/** Past sessions of one exercise, newest first, as one card per session. */
export function ExerciseHistoryDialog({
  exerciseId,
  exerciseName,
  measure,
  onOpenChange,
  open,
  workoutId,
}: ExerciseHistoryDialogProps) {
  const { t } = useI18n();
  const history = useQuery({
    ...exerciseHistoryQueryOptions(exerciseId, workoutId),
    enabled: open,
  });
  const entries = history.data ?? [];

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <header className={css.dialogHeader}>
          <div className={css.heading}>
            <DialogTitle>{exerciseName}</DialogTitle>
            {entries.length > 0 ? (
              <DialogDescription>
                {t({ en: 'Newest first', pl: 'Od najnowszych' })}
              </DialogDescription>
            ) : null}
          </div>
          <DialogClose
            render={
              <Btn
                aria-label={t({ en: 'Close', pl: 'Zamknij' })}
                icon={<XIcon aria-hidden='true' />}
                iconOnly
                size='sm'
                variant='ghost'
              />
            }
          />
        </header>
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
        {entries.length > 0 ? (
          <ol className={css.entries}>
            {entries.map((entry) => (
              <ExerciseHistoryEntry entry={entry} key={entry.id} measure={measure} />
            ))}
          </ol>
        ) : null}
      </DialogPopup>
    </DialogRoot>
  );
}
