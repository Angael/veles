import { and, asc, desc, eq, inArray, isNull, lt, ne, sql } from 'drizzle-orm';
import {
  workoutExercises,
  workoutRoutines,
  workoutSessionExercises,
  workoutSessions,
  workoutSets,
} from '@veles/db/schema';
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
    .select({ date: workoutSessions.date, id: workoutSessions.id })
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, workoutId), eq(workoutSessions.userId, userId)));
  if (!workout) throw new ClientSafeError('Workout not found.');
  return workout;
}

export async function requireOwnedSlot(tx: Db, userId: string, slotId: string) {
  const [slot] = await tx
    .select({
      exerciseId: workoutSessionExercises.exerciseId,
      id: workoutSessionExercises.id,
      position: workoutSessionExercises.position,
      workoutId: workoutSessionExercises.sessionId,
    })
    .from(workoutSessionExercises)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
    .where(and(eq(workoutSessionExercises.id, slotId), eq(workoutSessions.userId, userId)));
  if (!slot) throw new ClientSafeError('Exercise not found in this workout.');
  return slot;
}

export async function requireOwnedSet(tx: Db, userId: string, setId: string) {
  const [set] = await tx
    .select({
      id: workoutSets.id,
      position: workoutSets.position,
      sessionExerciseId: workoutSets.sessionExerciseId,
      workoutId: workoutSessions.id,
    })
    .from(workoutSets)
    .innerJoin(
      workoutSessionExercises,
      eq(workoutSessionExercises.id, workoutSets.sessionExerciseId),
    )
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
    .where(and(eq(workoutSets.id, setId), eq(workoutSessions.userId, userId)));
  if (!set) throw new ClientSafeError('Set not found.');
  return set;
}

/** A workout with no edits for this long is finished automatically. */
const AUTO_FINISH_MS = 2 * 60 * 60 * 1000;

/**
 * Finishes the user's workouts that nobody touched for two hours, ending them at the last edit,
 * so a forgotten Finish never turns 30 minutes of training into a five-hour session. Also
 * finishes every open workout except the newest, which repairs rows from before the one-open
 * rule. Runs on read and before starting a workout, so no background job is needed.
 */
export async function autoFinishIdleWorkouts(tx: Db, userId: string) {
  const open = and(eq(workoutSessions.userId, userId), isNull(workoutSessions.endedAt));
  await tx
    .update(workoutSessions)
    .set({ endedAt: sql`${workoutSessions.updatedAt}` })
    .where(and(open, lt(workoutSessions.updatedAt, new Date(Date.now() - AUTO_FINISH_MS))));
  const [, ...older] = await tx
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(open)
    .orderBy(desc(workoutSessions.id));
  if (older.length > 0) {
    await tx
      .update(workoutSessions)
      .set({ endedAt: sql`${workoutSessions.updatedAt}` })
      .where(
        inArray(
          workoutSessions.id,
          older.map((row) => row.id),
        ),
      );
  }
}

/** Records an edit; `updated_at` is the "last edit" that auto-finish ends a workout at. */
export async function touchWorkout(tx: Db, workoutId: string) {
  await tx
    .update(workoutSessions)
    .set({ updatedAt: new Date() })
    .where(eq(workoutSessions.id, workoutId));
}

/** Only one workout can be open at a time; call after `autoFinishIdleWorkouts`. */
export async function requireNoOpenWorkout(tx: Db, userId: string, exceptId?: string) {
  const [open] = await tx
    .select({ id: workoutSessions.id })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, userId),
        isNull(workoutSessions.endedAt),
        exceptId ? ne(workoutSessions.id, exceptId) : undefined,
      ),
    )
    .limit(1);
  if (open) throw new ClientSafeError('Finish your open workout first.');
}

export async function requireOwnedExercise(tx: Db, userId: string, exerciseId: string) {
  const [exercise] = await tx
    .select({ id: workoutExercises.id })
    .from(workoutExercises)
    .where(and(eq(workoutExercises.id, exerciseId), eq(workoutExercises.userId, userId)));
  if (!exercise) throw new ClientSafeError('Exercise not found.');
  return exercise;
}

/**
 * Filters to the user's sessions that come before the given one. UUIDv7 ids are time ordered, so
 * `(date, id)` puts same-day sessions in creation order.
 */
export function sessionsBefore(userId: string, workout: { date: string; id: string }) {
  return and(
    eq(workoutSessions.userId, userId),
    sql`(${workoutSessions.date}, ${workoutSessions.id}) < (${workout.date}::date, ${workout.id}::uuid)`,
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
    .selectDistinctOn([workoutSessionExercises.exerciseId], {
      exerciseId: workoutSessionExercises.exerciseId,
      id: workoutSessionExercises.id,
      notes: workoutSessionExercises.notes,
    })
    .from(workoutSessionExercises)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
    .where(
      and(
        sessionsBefore(userId, workout),
        inArray(workoutSessionExercises.exerciseId, exerciseIds),
        withNote ? ne(workoutSessionExercises.notes, '') : undefined,
      ),
    )
    .orderBy(
      workoutSessionExercises.exerciseId,
      desc(workoutSessions.date),
      desc(workoutSessions.id),
    );
}

async function setsBySlot(slotIds: string[]) {
  const rows =
    slotIds.length === 0
      ? []
      : await db
          .select()
          .from(workoutSets)
          .where(inArray(workoutSets.sessionExerciseId, slotIds))
          .orderBy(asc(workoutSets.position));
  const map = new Map<string, (typeof rows)[number][]>();
  for (const row of rows) {
    map.set(row.sessionExerciseId, [...(map.get(row.sessionExerciseId) ?? []), row]);
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
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, workoutId), eq(workoutSessions.userId, userId)));
  if (!workout) throw new ClientSafeError('Workout not found.');
  const current = { date: workout.date, id: workout.id };

  const slots = await db
    .select({
      exerciseId: workoutSessionExercises.exerciseId,
      id: workoutSessionExercises.id,
      measure: workoutExercises.measure,
      name: workoutExercises.name,
      notes: workoutSessionExercises.notes,
      restSeconds: workoutExercises.restSeconds,
    })
    .from(workoutSessionExercises)
    .innerJoin(workoutExercises, eq(workoutExercises.id, workoutSessionExercises.exerciseId))
    .where(eq(workoutSessionExercises.sessionId, workoutId))
    .orderBy(asc(workoutSessionExercises.position));

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
          .select({ id: workoutRoutines.id, name: workoutRoutines.name })
          .from(workoutRoutines)
          .where(and(eq(workoutRoutines.id, workout.routineId), eq(workoutRoutines.userId, userId)))
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
    .select({ id: workoutSessionExercises.id })
    .from(workoutSessionExercises)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
    .where(and(sessionsBefore(userId, workout), eq(workoutSessionExercises.exerciseId, exerciseId)))
    .orderBy(desc(workoutSessions.date), desc(workoutSessions.id))
    .limit(1);
  if (!previous) return 1;
  const [row] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(workoutSets)
    .where(eq(workoutSets.sessionExerciseId, previous.id));
  return Math.min(20, Math.max(1, row?.count ?? 1));
}

/** Next free position after the last row, so appends never hit the unique position index. */
export function nextPosition(rows: { max: number | null }[]) {
  return (rows[0]?.max ?? -1) + 1;
}
