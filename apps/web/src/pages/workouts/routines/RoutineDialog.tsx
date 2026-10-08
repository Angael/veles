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
  /** Shown read-only when viewing a saved routine. */
  exerciseNames?: string[];
  /** Adds a Delete button for a saved routine. */
  onDelete?: () => void;
  defaults: { name: string; description: string };
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; description: string }) => Promise<unknown>;
  open: boolean;
  pending: boolean;
  submitLabel: string;
  title: string;
};

/**
 * Name and optional description of a routine, for "Save as routine" and "Edit routine". A saved
 * routine also lists its exercises and can be deleted here.
 */
export function RoutineDialog({
  exerciseNames,
  onDelete,
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
          {exerciseNames ? (
            <div className={css.exerciseBlock}>
              <span className={css.exerciseHeading}>Exercises</span>
              {exerciseNames.length > 0 ? (
                <ol className={css.exerciseList}>
                  {exerciseNames.map((exerciseName, index) => (
                    // Names can repeat, so the position is part of the key.
                    <li key={`${index}-${exerciseName}`}>{exerciseName}</li>
                  ))}
                </ol>
              ) : (
                <p className={css.hint}>No exercises yet.</p>
              )}
              <p className={css.hint}>
                To change exercises, start this routine, edit the workout, then pick “Update
                routine” in its ⋯ menu.
              </p>
            </div>
          ) : null}
          <DialogActions>
            {onDelete ? (
              <Btn className={css.delete} onClick={onDelete} type='button' variant='ghostDanger'>
                Delete
              </Btn>
            ) : null}
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
