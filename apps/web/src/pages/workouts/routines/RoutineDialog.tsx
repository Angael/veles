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
import { TextareaInput } from '@/components/ui/textarea-input/TextareaInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import css from './Routines.module.css';

type RoutineDialogProps = {
  defaults: { name: string; description: string };
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; description: string }) => Promise<unknown>;
  open: boolean;
  pending: boolean;
  submitLabel: string;
  title: string;
};

/** Name and optional description of a routine, for "Save as routine" and "Edit routine". */
export function RoutineDialog({
  defaults,
  onOpenChange,
  onSubmit,
  open,
  pending,
  submitLabel,
  title,
}: RoutineDialogProps) {
  return (
    <DialogRoot onOpenChange={onOpenChange} open={open}>
      <DialogPopup>
        <DialogTitle>{title}</DialogTitle>
        <TypedForm
          className={css.form}
          onSubmit={async (data) => {
            await onSubmit({ description: data.string('description'), name: data.string('name') });
            onOpenChange(false);
          }}
        >
          <Label text='Name'>
            <TextInput defaultValue={defaults.name} maxLength={200} name='name' required />
          </Label>
          <Label text='Description (optional)'>
            <TextareaInput
              defaultValue={defaults.description}
              maxLength={2000}
              name='description'
              placeholder='e.g. Heavy day, 2–3 min rest on the big lifts'
              rows={3}
            />
          </Label>
          <DialogActions>
            <DialogClose render={<Btn variant='ghost' />}>Cancel</DialogClose>
            <Btn loading={pending} type='submit'>
              {submitLabel}
            </Btn>
          </DialogActions>
        </TypedForm>
      </DialogPopup>
    </DialogRoot>
  );
}
