import type { SetMetrics } from '../metrics';

type RuleSet = SetMetrics & { done: boolean };

/**
 * A set counts as touched when it is ticked or any cell holds a value. "Add set" copies values, so
 * an added set counts as touched too; that is fine, adding a set is a sign of work.
 */
function isTouched(set: RuleSet) {
  return (
    set.done ||
    set.reps !== null ||
    set.weightKg !== null ||
    set.durationSeconds !== null ||
    set.distanceKm !== null
  );
}

/**
 * Ids of the slots after the last touched one: the user ended the workout early and skipped them,
 * so Finish must not save last time's hints as done. Empty when nothing is touched, because then
 * the user most likely logs the workout after the fact and did every exercise as suggested.
 */
export function skippedSlotIds(slots: { id: string; sets: RuleSet[] }[]) {
  const lastTouched = slots.findLastIndex((slot) => slot.sets.some(isTouched));
  if (lastTouched === -1) return [];
  return slots.slice(lastTouched + 1).map((slot) => slot.id);
}
