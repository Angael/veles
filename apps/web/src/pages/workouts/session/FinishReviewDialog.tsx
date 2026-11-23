import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import {
  DialogActions,
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import type { WorkoutSlotData } from '../workouts.server';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type FinishReviewDialogProps = {
  loading: boolean;
  onFinish: (skipSlotIds: string[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  /** Exercises without a ticked set; each starts checked as "done as suggested". */
  slots: Pick<WorkoutSlotData, 'id' | 'name'>[];
};

/**
 * Asks on Finish which untouched exercises the user did. Checked ones keep their suggested numbers;
 * unchecked ones are sent as skipped, so an ended-early workout does not save them as done.
 */
export function FinishReviewDialog({
  loading,
  onFinish,
  onOpenChange,
  open,
  slots,
}: FinishReviewDialogProps) {
  const { t } = useI18n();
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());

  function toggle(id: string, done: boolean) {
    setSkipped((current) => {
      const next = new Set(current);
      if (done) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <DialogRoot
      onOpenChange={(next) => {
        if (next) setSkipped(new Set());
        onOpenChange(next);
      }}
      open={open}
    >
      <DialogPopup>
        <DialogTitle>
          {t({ en: 'Which exercises did you do?', pl: 'Które ćwiczenia wykonano?' })}
        </DialogTitle>
        <p className={css.reviewHint}>
          {t({
            en: 'Checked ones save the suggested numbers. Unchecked ones are saved as not done.',
            pl: 'Zaznaczone zapiszą sugerowane wartości. Odznaczone zapiszą się jako niewykonane.',
          })}
        </p>
        <ul className={css.reviewList}>
          {slots.map((slot) => (
            <li key={slot.id}>
              <label className={css.reviewItem}>
                <Checkbox
                  checked={!skipped.has(slot.id)}
                  onCheckedChange={(done) => toggle(slot.id, done)}
                />
                {slot.name}
              </label>
            </li>
          ))}
        </ul>
        <DialogActions>
          <DialogClose render={<Btn variant='ghost' />}>
            {t({ en: 'Back', pl: 'Wróć' })}
          </DialogClose>
          <Btn loading={loading} onClick={() => onFinish([...skipped])}>
            {t({ en: 'Finish', pl: 'Zakończ' })}
          </Btn>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}
