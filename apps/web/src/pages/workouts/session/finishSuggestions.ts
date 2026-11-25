import { type SetMetrics, type SetType, unconfirmedFill, workingSetNumbers } from '../metrics';
import type { WorkoutSessionData } from '../workouts.server';

export type SuggestedSet = {
  id: string;
  /** Working-set number, matching the badge on the session screen. */
  number: number;
  type: SetType;
  /** The set as it would be saved: entered values plus last time's for the empty cells. */
  filled: SetMetrics;
};

export type SuggestedExercise = { id: string; name: string; sets: SuggestedSet[] };

/**
 * Every unticked set with something to save, grouped by exercise. Only the green tick marks a set
 * done, so Finish lists these for the user to confirm; anything not picked stays as entered.
 */
export function finishSuggestions(session: WorkoutSessionData): SuggestedExercise[] {
  return session.slots.flatMap((slot) => {
    const numbers = workingSetNumbers(slot.sets);
    const sets = slot.sets.flatMap((set, index) => {
      const filled = unconfirmedFill(set, slot.measure);
      if (!filled) return [];
      return [
        {
          filled,
          id: set.id,
          number: numbers[index] ?? 0,
          type: set.type,
        },
      ];
    });
    return sets.length > 0 ? [{ id: slot.id, name: slot.name, sets }] : [];
  });
}
