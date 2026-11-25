import { type SetMetrics, type SetType, suggestedFill, workingSetNumbers } from '../metrics';
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
 * Unticked sets with empty cells that last time can fill, grouped by exercise. Finish lists them
 * so the user picks what was done; anything not picked stays as entered.
 */
export function finishSuggestions(session: WorkoutSessionData): SuggestedExercise[] {
  return session.slots.flatMap((slot) => {
    const numbers = workingSetNumbers(slot.sets);
    const sets = slot.sets.flatMap((set, index) => {
      const patch = suggestedFill(set, slot.measure);
      if (!patch) return [];
      const { distanceKm, durationSeconds, reps, weightKg } = { ...set, ...patch };
      return [
        {
          filled: { distanceKm, durationSeconds, reps, weightKg },
          id: set.id,
          number: numbers[index] ?? 0,
          type: set.type,
        },
      ];
    });
    return sets.length > 0 ? [{ id: slot.id, name: slot.name, sets }] : [];
  });
}
