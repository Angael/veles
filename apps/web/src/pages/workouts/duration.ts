type TimedSet = { done: boolean; durationSeconds: number | null };

/** Only completed sets contribute training time; planned/copied values are not logged work. */
export function completedSetDuration(slots: { sets: TimedSet[] }[]): number {
  return slots.reduce(
    (total, slot) =>
      total + slot.sets.reduce((sum, set) => sum + (set.done ? (set.durationSeconds ?? 0) : 0), 0),
    0,
  );
}

/** Floors elapsed time at completed exercise time without inventing start/end timestamps. */
export function workoutDuration(elapsed: number | null, completedSeconds: number): number | null {
  if (elapsed === null && completedSeconds === 0) return null;
  return Math.max(0, elapsed ?? 0, completedSeconds);
}

export function elapsedSeconds(startedAt: string | null, endedAt: string | null): number | null {
  return startedAt && endedAt
    ? Math.max(0, (Date.parse(endedAt) - Date.parse(startedAt)) / 1000)
    : null;
}
