import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { exercises, workoutExercises, workouts, workoutSets } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db, type DbTransaction } from '@/server/db.server';
import type { Measure, SetMetrics, SetType } from './metrics';

export type WorkoutSetData = SetMetrics & {
  id: string;
  type: SetType;
  done: boolean;
  /** Same position in the last session of this exercise, shown as the ghost value. */
  previous: SetMetrics | null;
};

export type WorkoutSlotData = {
  id: string;
  exerciseId: string;
  name: string;
  measure: Measure;
  restSeconds: number | null;
  note: string;
  /** Latest non-empty note from an earlier session, used as the note placeholder. */
  previousNote: string | null;
  sets: WorkoutSetData[];
};

export type WorkoutSessionData = {
  id: string;
  name: string;
  date: string;
  startedAt: string | null;
  endedAt: string | null;
  /** Routine this session started from or was saved as; offers "Update routine". */
  routine: { id: string; name: string } | null;
  slots: WorkoutSlotData[];
};

type Db = typeof db | DbTransaction;

/** Stored set row (grams, meters) to display units (kg, km). */
export function toMetrics(row: {
  weightGrams: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
}): SetMetrics {
  return {
    distanceKm: row.distanceMeters === null ? null : row.distanceMeters / 1_000,
    durationSeconds: row.durationSeconds,
    reps: row.reps,
    weightKg: row.weightGrams === null ? null : row.weightGrams / 1_000,
  };
}

/** Display units to stored columns; only keys present in the patch are returned. */
export function toSetColumns(patch: Partial<SetMetrics>) {
  const scaled = (value: number | null | undefined, factor: number) =>
    value === null || value === undefined ? null : Math.round(value * factor);
  return {
    ...('weightKg' in patch ? { weightGrams: scaled(patch.weightKg, 1_000) } : {}),
    ...('reps' in patch ? { reps: scaled(patch.reps, 1) } : {}),
    ...('durationSeconds' in patch ? { durationSeconds: scaled(patch.durationSeconds, 1) } : {}),
    ...('distanceKm' in patch ? { distanceMeters: scaled(patch.distanceKm, 1_000) } : {}),
  };
}

export async function requireOwnedWorkout(tx: Db, userId: string, workoutId: string) {
  const [workout] = await tx
    .select({ date: workouts.date, id: workouts.id })
    .from(workouts)
    .where(
      and(eq(workouts.id, workoutId), eq(workouts.userId, userId), eq(workouts.kind, 'session')),
    );
  if (!workout?.date) throw new ClientSafeError('Workout not found.');
  return { ...workout, date: workout.date };
}

export async function requireOwnedSlot(tx: Db, userId: string, slotId: string) {
  const [slot] = await tx
    .select({
      exerciseId: workoutExercises.exerciseId,
      id: workoutExercises.id,
      position: workoutExercises.position,
      workoutId: workoutExercises.workoutId,
    })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(eq(workoutExercises.id, slotId), eq(workouts.userId, userId)));
  if (!slot) throw new ClientSafeError('Exercise not found in this workout.');
  return slot;
}

export async function requireOwnedSet(tx: Db, userId: string, setId: string) {
  const [set] = await tx
    .select({
      id: workoutSets.id,
      position: workoutSets.position,
      workoutExerciseId: workoutSets.workoutExerciseId,
    })
    .from(workoutSets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(eq(workoutSets.id, setId), eq(workouts.userId, userId)));
  if (!set) throw new ClientSafeError('Set not found.');
  return set;
}

export async function requireOwnedExercise(tx: Db, userId: string, exerciseId: string) {
  const [exercise] = await tx
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)));
  if (!exercise) throw new ClientSafeError('Exercise not found.');
  return exercise;
}

/**
 * Filters to the user's sessions that come before the given one. UUIDv7 ids are time ordered, so
 * `(date, id)` puts same-day sessions in creation order.
 */
export function sessionsBefore(userId: string, workout: { date: string; id: string }) {
  return and(
    eq(workouts.userId, userId),
    eq(workouts.kind, 'session'),
    sql`(${workouts.date}, ${workouts.id}) < (${workout.date}::date, ${workout.id}::uuid)`,
  );
}

/** Latest earlier slot per exercise, optionally only slots that have a note. */
async function latestEarlierSlots(
  userId: string,
  workout: { date: string; id: string },
  exerciseIds: string[],
  withNote: boolean,
) {
  if (exerciseIds.length === 0) return [];
  return db
    .selectDistinctOn([workoutExercises.exerciseId], {
      exerciseId: workoutExercises.exerciseId,
      id: workoutExercises.id,
      notes: workoutExercises.notes,
    })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(
      and(
        sessionsBefore(userId, workout),
        inArray(workoutExercises.exerciseId, exerciseIds),
        withNote ? ne(workoutExercises.notes, '') : undefined,
      ),
    )
    .orderBy(workoutExercises.exerciseId, desc(workouts.date), desc(workouts.id));
}

async function setsBySlot(slotIds: string[]) {
  const rows =
    slotIds.length === 0
      ? []
      : await db
          .select()
          .from(workoutSets)
          .where(inArray(workoutSets.workoutExerciseId, slotIds))
          .orderBy(asc(workoutSets.position));
  const map = new Map<string, (typeof rows)[number][]>();
  for (const row of rows) {
    map.set(row.workoutExerciseId, [...(map.get(row.workoutExerciseId) ?? []), row]);
  }
  return map;
}

/** Everything the live session screen shows, including last time's values and notes. */
export async function loadWorkoutSession(
  userId: string,
  workoutId: string,
): Promise<WorkoutSessionData> {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(
      and(eq(workouts.id, workoutId), eq(workouts.userId, userId), eq(workouts.kind, 'session')),
    );
  if (!workout?.date) throw new ClientSafeError('Workout not found.');
  const current = { date: workout.date, id: workout.id };

  const slots = await db
    .select({
      exerciseId: workoutExercises.exerciseId,
      id: workoutExercises.id,
      measure: exercises.measure,
      name: exercises.name,
      notes: workoutExercises.notes,
      restSeconds: exercises.restSeconds,
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(asc(workoutExercises.position));

  const exerciseIds = [...new Set(slots.map((slot) => slot.exerciseId))];
  const [previousSlots, previousNotes] = await Promise.all([
    latestEarlierSlots(userId, current, exerciseIds, false),
    latestEarlierSlots(userId, current, exerciseIds, true),
  ]);
  const previousSlotByExercise = new Map(previousSlots.map((slot) => [slot.exerciseId, slot.id]));
  const noteByExercise = new Map(previousNotes.map((slot) => [slot.exerciseId, slot.notes]));
  const [sets, [routine]] = await Promise.all([
    setsBySlot([...slots.map((slot) => slot.id), ...previousSlots.map((slot) => slot.id)]),
    workout.routineId
      ? db
          .select({ id: workouts.id, name: workouts.name })
          .from(workouts)
          .where(and(eq(workouts.id, workout.routineId), eq(workouts.userId, userId)))
      : [],
  ]);

  return {
    date: workout.date,
    endedAt: workout.endedAt?.toISOString() ?? null,
    id: workout.id,
    name: workout.name,
    routine: routine ?? null,
    slots: slots.map((slot) => {
      const previousSlotId = previousSlotByExercise.get(slot.exerciseId);
      const previousSets = previousSlotId ? (sets.get(previousSlotId) ?? []) : [];
      return {
        exerciseId: slot.exerciseId,
        id: slot.id,
        measure: slot.measure,
        name: slot.name,
        note: slot.notes,
        previousNote: noteByExercise.get(slot.exerciseId) ?? null,
        restSeconds: slot.restSeconds,
        sets: (sets.get(slot.id) ?? []).map((set, index) => {
          const previous = previousSets[index];
          return {
            ...toMetrics(set),
            done: set.completedAt !== null,
            id: set.id,
            previous: previous ? toMetrics(previous) : null,
            type: set.type,
          };
        }),
      };
    }),
    startedAt: workout.startedAt?.toISOString() ?? null,
  };
}

/** Number of sets the exercise had last time, so a new slot starts with that many empty rows. */
export async function previousSetCount(
  tx: Db,
  userId: string,
  workout: { date: string; id: string },
  exerciseId: string,
) {
  const [previous] = await tx
    .select({ id: workoutExercises.id })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(sessionsBefore(userId, workout), eq(workoutExercises.exerciseId, exerciseId)))
    .orderBy(desc(workouts.date), desc(workouts.id))
    .limit(1);
  if (!previous) return 1;
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(workoutSets)
    .where(eq(workoutSets.workoutExerciseId, previous.id));
  return Math.min(20, Math.max(1, row?.count ?? 1));
}

/** Next free position after the last row, so appends never hit the unique position index. */
export function nextPosition(rows: { max: number | null }[]) {
  return (rows[0]?.max ?? -1) + 1;
}
