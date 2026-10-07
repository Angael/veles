import { SeamlessTextarea } from '@/components/ui/seamless-textarea/SeamlessTextarea';
import { historyFor, type MockSlot } from '../mockData';
import type { SessionActions } from './useMockSession';
import css from './ExerciseNotes.module.css';

type ExerciseNoteProps = {
  actions: SessionActions;
  slot: MockSlot;
};

/**
 * Note for this exercise in this workout (`workout_exercise.notes`). Always present under the
 * title; last time's note sits in the placeholder, so "seat on 4" is right there.
 */
export function ExerciseNote({ actions, slot }: ExerciseNoteProps) {
  const last = historyFor(slot.name).find((entry) => entry.note);

  return (
    <SeamlessTextarea
      aria-label={`Note for ${slot.name}`}
      className={css.note}
      defaultValue={slot.note}
      onBlur={(event) => actions.updateSlot(slot.id, { note: event.target.value.trim() })}
      placeholder={last ? `Last time: ${last.note}` : 'Add a note…'}
      rows={1}
    />
  );
}
