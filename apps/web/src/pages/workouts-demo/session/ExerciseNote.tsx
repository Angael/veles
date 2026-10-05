import { historyFor, type MockSlot } from '../mockData';
import type { SessionActions } from './useMockSession';
import css from './ExerciseNotes.module.css';

type ExerciseNoteProps = {
  actions: SessionActions;
  onClose: () => void;
  slot: MockSlot;
};

/**
 * Note for this exercise in this workout (`workout_exercise.notes`). Last time's note sits in the
 * placeholder, so "seat on 4" is right there without opening history.
 */
export function ExerciseNote({ actions, onClose, slot }: ExerciseNoteProps) {
  const last = historyFor(slot.name).find((entry) => entry.note);

  return (
    <textarea
      aria-label={`Note for ${slot.name}`}
      autoFocus={!slot.note}
      className={css.note}
      defaultValue={slot.note}
      onBlur={(event) => {
        const note = event.target.value.trim();
        actions.updateSlot(slot.id, { note });
        if (!note) onClose();
      }}
      placeholder={
        last ? `Last time (${last.date}): ${last.note}` : 'Seat height, grip, how it felt…'
      }
      rows={1}
    />
  );
}
