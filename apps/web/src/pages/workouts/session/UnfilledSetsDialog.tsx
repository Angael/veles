import { Btn } from '@/components/ui/btn/Btn';
import {
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogRoot,
  DialogTitle,
} from '@/components/ui/dialog/Dialog';
import { describeSet, hintFill } from '../metrics';
import type { WorkoutSessionData } from '../workouts.server';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Locale } from '@/lib/i18n/locale';

export type UnfilledSets = 'fill' | 'skip';

export type UnfilledExercise = { id: string; name: string; sets: string[] };

/**
 * Exercises with unticked sets that still show grey hints, each with the values a fill would
 * save. Grey hints look like logged values, so Finish asks about them instead of guessing.
 */
export function unfilledExercises(session: WorkoutSessionData, locale: Locale): UnfilledExercise[] {
  return session.slots.flatMap((slot) => {
    const sets = slot.sets.flatMap((set) => {
      const patch = hintFill(set, slot.measure);
      return patch ? [describeSet({ ...set, ...patch }, locale)] : [];
    });
    return sets.length > 0 ? [{ id: slot.id, name: slot.name, sets }] : [];
  });
}

type UnfilledSetsDialogProps = {
  exercises: UnfilledExercise[];
  onClose: () => void;
  onFinish: (unfilledSets: UnfilledSets) => void;
  pending: boolean;
};

/** Asks what to do with sets that only show grey hints before the workout ends. */
export function UnfilledSetsDialog({
  exercises,
  onClose,
  onFinish,
  pending,
}: UnfilledSetsDialogProps) {
  const { t } = useI18n();
  const count = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);

  return (
    <DialogRoot onOpenChange={(open) => !open && onClose()} open={exercises.length > 0}>
      <DialogPopup>
        <DialogTitle>
          {t({
            en: count === 1 ? '1 set is not filled in' : `${count} sets are not filled in`,
            pl: count === 1 ? '1 seria nie jest wypełniona' : `Niewypełnione serie: ${count}`,
          })}
        </DialogTitle>
        <DialogDescription>
          {t({
            en: 'Grey numbers are only hints. They are not saved until you type, drag or tick them. Finishing without them removes empty sets and keeps what you typed.',
            pl: 'Szare liczby to tylko podpowiedzi. Nie zapisują się, dopóki ich nie wpiszesz, nie przeciągniesz lub nie zaznaczysz. Zakończenie bez nich usuwa puste serie i zostawia to, co wpisano.',
          })}
        </DialogDescription>
        <ul className={css.unfilledList}>
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <strong>{exercise.name}</strong>
              <span>{exercise.sets.join(', ')}</span>
            </li>
          ))}
        </ul>
        <DialogActions>
          <DialogClose disabled={pending} render={<Btn variant='ghost' />}>
            {t({ en: 'Keep logging', pl: 'Wróć do treningu' })}
          </DialogClose>
          <Btn disabled={pending} onClick={() => onFinish('skip')} variant='outlineMain'>
            {t({ en: 'Finish without them', pl: 'Zakończ bez nich' })}
          </Btn>
          <Btn loading={pending} onClick={() => onFinish('fill')}>
            {t({ en: 'Save grey values', pl: 'Zapisz szare wartości' })}
          </Btn>
        </DialogActions>
      </DialogPopup>
    </DialogRoot>
  );
}
