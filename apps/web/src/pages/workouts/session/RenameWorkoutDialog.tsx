import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { Label } from '@/components/ui/label/Label';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { useUpdateWorkoutMutation } from '../workouts.query';
import type { WorkoutSessionData } from '../workouts.server';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { selectOnMount } from '@/lib/selectOnMount';

type RenameWorkoutDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  session: WorkoutSessionData;
};

/** Renames the session. An unchanged name closes without saving. */
export function RenameWorkoutDialog({ onOpenChange, open, session }: RenameWorkoutDialogProps) {
  const { t } = useI18n();
  const update = useUpdateWorkoutMutation();

  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>{t({ en: 'Rename workout', pl: 'Zmień nazwę treningu' })}</DialogTitle>
        <TypedForm
          className={css.dialogForm}
          onSubmit={(data) => {
            const name = data.string('name').trim();
            if (!name || name === session.name) return onOpenChange(false);
            update.mutate({ id: session.id, name }, { onSuccess: () => onOpenChange(false) });
          }}
        >
          <Label text={t({ en: 'Name', pl: 'Nazwa' })}>
            <TextInput
              defaultValue={session.name}
              maxLength={200}
              name='name'
              ref={selectOnMount}
              required
            />
          </Label>
          <DialogActions>
            <DialogClose render={<Btn variant='ghost' />}>
              {t({ en: 'Cancel', pl: 'Anuluj' })}
            </DialogClose>
            <Btn loading={update.isPending} type='submit'>
              {t({ en: 'Save', pl: 'Zapisz' })}
            </Btn>
          </DialogActions>
        </TypedForm>
      </DialogPopup>
    </DialogRoot>
  );
}
