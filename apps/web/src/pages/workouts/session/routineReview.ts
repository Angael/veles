import type { SetType } from '../metrics';
import type { RoutineDetail } from '../routines/routines.api';
import type { WorkoutSessionData, WorkoutSetData } from '../workouts.server';

/** One routine exercise as the routine stores it: which exercise and its set types in order. */
export type RoutinePlanExercise = { exerciseId: string; setTypes: SetType[] };

/**
 * How one exercise differs between the routine and the finished workout. `before` is null for an
 * added exercise, `after` for a removed one; `move` holds 1-based positions when it changed place.
 */
export type RoutineChange = {
  key: string;
  name: string;
  before: SetType[] | null;
  after: SetType[] | null;
  move: { from: number; to: number } | null;
  /** Kept exercise whose set count or set types differ. */
  setsChanged: boolean;
};

export type RoutineReview = {
  routineId: string;
  routineName: string;
  /** The routine as this review saw it; the update is refused if it changed since. */
  reviewed: RoutinePlanExercise[];
  /** The whole plan the routine gets if the user picks "Update routine". */
  plan: RoutinePlanExercise[];
  changes: RoutineChange[];
};

/** A set the user neither ticked nor filled in; skipping it says nothing about the plan. */
function skipped(set: WorkoutSetData) {
  return (
    !set.done &&
    set.weightKg === null &&
    set.reps === null &&
    set.durationSeconds === null &&
    set.distanceKm === null
  );
}

/** Set count to keep: trailing skipped sets are dropped, but never below `floor`. */
function keptSetCount(sets: WorkoutSetData[], floor: number) {
  let count = sets.length;
  while (count > floor) {
    const last = sets[count - 1];
    if (!last || !skipped(last)) break;
    count--;
  }
  return count;
}

function sameTypes(a: SetType[], b: SetType[]) {
  return a.length === b.length && a.every((type, index) => type === b[index]);
}

/** Indexes of `values` in its longest increasing run; the rest are the exercises that moved. */
function longestIncreasing(values: number[]) {
  const longer = (a: number[], b: number[]) => (b.length > a.length ? b : a);
  const runs: { value: number; run: number[] }[] = [];
  for (const [index, value] of values.entries()) {
    const best = runs
      .filter((entry) => entry.value < value)
      .reduce<number[]>((a, entry) => longer(a, entry.run), []);
    runs.push({ run: [...best, index], value });
  }
  return new Set(runs.reduce<number[]>((a, entry) => longer(a, entry.run), []));
}

/**
 * Compares a finished workout with the routine it started from and proposes the routine's next
 * plan. Only structure counts: exercises, their order, set counts and set types. Values never do,
 * and skipped sets (empty and not ticked) at the end of an exercise never shrink or grow the
 * plan, so finishing early cannot quietly rewrite the routine. An added exercise with nothing
 * logged is left out. Returns null when nothing meaningful changed, or when the plan would end up
 * empty, so a routine is never wiped.
 */
export function reviewRoutineChanges(
  session: WorkoutSessionData,
  routine: RoutineDetail,
): RoutineReview | null {
  // The k-th slot of an exercise matches the routine's k-th entry of it, so repeats pair up.
  const routineIndexes = new Map<string, number[]>();
  routine.exercises.forEach((exercise, index) => {
    routineIndexes.set(exercise.exerciseId, [
      ...(routineIndexes.get(exercise.exerciseId) ?? []),
      index,
    ]);
  });

  const planned = session.slots.flatMap((slot) => {
    const routineIndex = routineIndexes.get(slot.exerciseId)?.shift() ?? null;
    const before =
      routineIndex === null ? null : (routine.exercises[routineIndex]?.setTypes ?? null);
    const count = keptSetCount(slot.sets, before?.length ?? 0);
    if (before === null && count === 0) return [];
    const after = count === 0 ? (before ?? []) : slot.sets.slice(0, count).map((set) => set.type);
    return [{ after, before, key: slot.id, name: slot.name, routineIndex, slot }];
  });
  if (planned.length === 0) return null;

  const matched = planned.flatMap((entry, index) =>
    entry.routineIndex === null ? [] : [{ index, routineIndex: entry.routineIndex }],
  );
  const inOrder = longestIncreasing(matched.map((entry) => entry.routineIndex));
  const movedAt = new Map(
    matched
      .filter((_, index) => !inOrder.has(index))
      .map((entry) => [entry.index, { from: entry.routineIndex + 1, to: entry.index + 1 }]),
  );
  const usedIndexes = new Set(matched.map((entry) => entry.routineIndex));

  const changes: RoutineChange[] = [
    ...planned.flatMap((entry, index) => {
      const move = movedAt.get(index) ?? null;
      const setsChanged = entry.before !== null && !sameTypes(entry.before, entry.after);
      if (entry.before && !move && !setsChanged) return [];
      const { after, before, key, name } = entry;
      return [{ after, before, key, move, name, setsChanged }];
    }),
    ...routine.exercises.flatMap((exercise, index) =>
      usedIndexes.has(index)
        ? []
        : [
            {
              after: null,
              before: exercise.setTypes,
              key: exercise.id,
              move: null,
              name: exercise.name,
              setsChanged: false,
            },
          ],
    ),
  ];
  if (changes.length === 0) return null;

  return {
    changes,
    plan: planned.map((entry) => ({ exerciseId: entry.slot.exerciseId, setTypes: entry.after })),
    reviewed: routine.exercises.map(({ exerciseId, setTypes }) => ({ exerciseId, setTypes })),
    routineId: routine.id,
    routineName: routine.name,
  };
}
