import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import type { WorkoutSlotData } from '../workouts.server';
import type { SessionActions } from './session.query';
import css from './ExerciseNotes.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type ExerciseNoteProps = {
  actions: SessionActions;
  slot: WorkoutSlotData;
};

/**
 * Note for this exercise in this workout (`workout_exercise.notes`). Always present under the
 * title; last time's note sits in the placeholder, so "seat on 4" is right there.
 */
export function ExerciseNote({ actions, slot }: ExerciseNoteProps) {
  const { t } = useI18n();

  return (
    <SeamlessTextarea
      aria-label={t({ en: `Note for ${slot.name}`, pl: `Notatka: ${slot.name}` })}
      className={css.note}
      defaultValue={slot.note}
      onBlur={(event) => {
        const notes = event.target.value.trim();
        if (notes !== slot.note) actions.updateNote(slot.id, notes);
      }}
      placeholder={
        slot.previousNote
          ? t({ en: `Last time: ${slot.previousNote}`, pl: `Ostatnio: ${slot.previousNote}` })
          : t({ en: 'Add a note…', pl: 'Dodaj notatkę…' })
      }
      rows={1}
    />
  );
}
