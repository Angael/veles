import { Btn } from '@/components/ui/btn/Btn';
import { DateInput } from '@/components/ui/date-input/DateInput';
import {
  DialogActions,
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { Label } from '@/components/ui/label/Label';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { useMoveWorkoutMutation } from '../workouts.query';
import type { WorkoutSessionData } from '../workouts.server';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type MoveWorkoutDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  session: WorkoutSessionData;
};

/**
 * Picks another local day for the session. The same day closes without saving; a failed save
 * keeps the dialog open with the picked day, so the user can try again.
 */
export function MoveWorkoutDialog({ onOpenChange, open, session }: MoveWorkoutDialogProps) {
  const { t } = useI18n();
  const move = useMoveWorkoutMutation();

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>{t({ en: 'Move to another day', pl: 'Przenieś na inny dzień' })}</DialogTitle>
        <TypedForm
          className={css.moveForm}
          onSubmit={(data) => {
            const date = data.string('date');
            if (date === session.date) return onOpenChange(false);
            move.mutate({ date, id: session.id }, { onSuccess: () => onOpenChange(false) });
          }}
        >
          <Label text={t({ en: 'Day', pl: 'Dzień' })}>
            <DateInput defaultValue={session.date} name='date' required />
          </Label>
          <DialogActions>
            <DialogClose render={<Btn variant='ghost' />}>
              {t({ en: 'Cancel', pl: 'Anuluj' })}
            </DialogClose>
            <Btn loading={move.isPending} type='submit'>
              {t({ en: 'Move', pl: 'Przenieś' })}
            </Btn>
          </DialogActions>
        </TypedForm>
      </DialogPopup>
    </DialogRoot>
  );
}
