import { ArchiveIcon, ArchiveRestoreIcon, HistoryIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { Label } from '@/components/ui/label/Label';
import { SelectInput } from '@/components/ui/select-input/SelectInput';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { formatDuration, REST_PRESETS, type Measure } from '../../metrics';
import { ExerciseHistoryDialog } from '../../session/ExerciseHistoryDialog';
import { MeasurePicker } from '../MeasurePicker';
import type { ExerciseLibraryEntry } from '../exercises.server';
import { useDeleteExerciseMutation, useUpdateExerciseMutation } from '../exercises.query';
import css from './ExerciseLibrary.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type ExerciseDialogProps = {
  exercise: ExerciseLibraryEntry;
  onClose: () => void;
};

/** Rest choices as select values; a value set elsewhere (e.g. by an agent) stays selectable. */
function restItems(current: number | null, offLabel: string) {
  const seconds = new Set<number | null>(REST_PRESETS);
  seconds.add(current);
  return [...seconds]
    .toSorted((a, b) => (a ?? -1) - (b ?? -1))
    .map((value) => ({
      label: value === null ? offLabel : formatDuration(value),
      value: value === null ? 'off' : String(value),
    }));
}

/**
 * Edits one exercise: name, tracking and rest timer apply to every workout. Archiving hides it
 * from the picker but keeps its history; only an unused exercise can be deleted.
 */
export function ExerciseDialog({ exercise, onClose }: ExerciseDialogProps) {
  const { t } = useI18n();
  const update = useUpdateExerciseMutation();
  const remove = useDeleteExerciseMutation();
  const [measure, setMeasure] = useState<Measure>(exercise.measure);
  const [rest, setRest] = useState(
    exercise.restSeconds === null ? 'off' : String(exercise.restSeconds),
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const unused = exercise.sessionCount === 0 && exercise.routineCount === 0;

  return (
    <DialogRoot onOpenChange={(open) => !open && onClose()} open>
      <DialogPopup>
        <DialogTitle>{t({ en: 'Edit exercise', pl: 'Edytuj ćwiczenie' })}</DialogTitle>
        {exercise.archived ? (
          <DialogDescription>
            {t({
              en: 'Archived: hidden when you add exercises to a workout.',
              pl: 'Zarchiwizowane: ukryte przy dodawaniu ćwiczeń do treningu.',
            })}
          </DialogDescription>
        ) : null}
        <TypedForm
          className={css.form}
          onSubmit={async (data) => {
            await update.mutateAsync({
              id: exercise.id,
              measure,
              name: data.string('name'),
              restSeconds: rest === 'off' ? null : Number(rest),
            });
            onClose();
          }}
        >
          <Label text={t({ en: 'Name', pl: 'Nazwa' })}>
            <TextInput defaultValue={exercise.name} maxLength={200} name='name' required />
          </Label>
          <MeasurePicker onChange={setMeasure} value={measure} />
          <Label text={t({ en: 'Rest timer', pl: 'Czas przerwy' })}>
            <SelectInput
              items={restItems(exercise.restSeconds, t({ en: 'Off', pl: 'Wyłączony' }))}
              onValueChange={(value) => value && setRest(value)}
              value={rest}
            />
          </Label>
          <div className={css.extraActions}>
            <Btn
              icon={<HistoryIcon aria-hidden='true' />}
              onClick={() => setHistoryOpen(true)}
              size='sm'
              type='button'
              variant='ghost'
            >
              {t({ en: 'History', pl: 'Historia' })}
            </Btn>
            <Btn
              icon={
                exercise.archived ? (
                  <ArchiveRestoreIcon aria-hidden='true' />
                ) : (
                  <ArchiveIcon aria-hidden='true' />
                )
              }
              loading={update.isPending && update.variables.archived !== undefined}
              onClick={() =>
                update.mutate(
                  { archived: !exercise.archived, id: exercise.id },
                  { onSuccess: onClose },
                )
              }
              size='sm'
              type='button'
              variant='ghost'
            >
              {exercise.archived
                ? t({ en: 'Restore', pl: 'Przywróć' })
                : t({ en: 'Archive', pl: 'Archiwizuj' })}
            </Btn>
            {unused ? (
              <Btn
                icon={<Trash2Icon aria-hidden='true' />}
                loading={remove.isPending}
                onClick={() => {
                  const message = t({
                    en: `Delete “${exercise.name}”?`,
                    pl: `Usunąć „${exercise.name}”?`,
                  });
                  if (!window.confirm(message)) return;
                  remove.mutate({ id: exercise.id }, { onSuccess: onClose });
                }}
                size='sm'
                type='button'
                variant='ghostDanger'
              >
                {t({ en: 'Delete', pl: 'Usuń' })}
              </Btn>
            ) : null}
          </div>
          <DialogActions>
            <DialogClose render={<Btn variant='ghost' />}>
              {t({ en: 'Cancel', pl: 'Anuluj' })}
            </DialogClose>
            <Btn loading={update.isPending && update.variables.name !== undefined} type='submit'>
              {t({ en: 'Save', pl: 'Zapisz' })}
            </Btn>
          </DialogActions>
        </TypedForm>
        <ExerciseHistoryDialog
          exerciseId={exercise.id}
          exerciseName={exercise.name}
          onOpenChange={setHistoryOpen}
          open={historyOpen}
        />
      </DialogPopup>
    </DialogRoot>
  );
}
