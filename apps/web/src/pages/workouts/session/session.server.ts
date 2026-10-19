import { format, parseISO } from 'date-fns';
import { and, asc, desc, eq, gt, lt, sql } from 'drizzle-orm';
import {
  type exerciseMeasures,
  workoutExercises,
  workoutSessionExercises,
  workoutSessions,
  workoutSets,
} from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db, type DbTransaction } from '@/server/db.server';
import {
  autoFinishIdleWorkouts,
  completeFilledSets,
  nextPosition,
  previousSetCount,
  requireNoOpenWorkout,
  requireOwnedExercise,
  requireOwnedSet,
  requireOwnedSlot,
  requireOwnedWorkout,
  toSetColumns,
  touchWorkout,
} from '../workouts.server';
import type {
  addWorkoutExerciseInputType,
  addWorkoutSetInputType,
  moveWorkoutExerciseInputType,
  startWorkoutInputType,
  updateWorkoutExerciseInputType,
  updateWorkoutInputType,
  updateWorkoutSetInputType,
  workoutIdType,
} from '../workouts.validation';

type IdInput = typeof workoutIdType.infer;

/** Creates an empty session for the given local day, named after the weekday. */
export async function startWorkoutRecord(userId: string, data: typeof startWorkoutInputType.infer) {
  await autoFinishIdleWorkouts(db, userId);
  await requireNoOpenWorkout(db, userId);
  const [workout] = await db
    .insert(workoutSessions)
    .values({
      date: data.date,
      name: `${format(parseISO(data.date), 'EEEE')} workout`,
      startedAt: new Date(),
      userId,
    })
    .returning({ id: workoutSessions.id });
  if (!workout) throw new Error('Workout insert returned no row.');
  return { id: workout.id };
}

/** Renames a session, or finishes / reopens it. Reopening is refused while another is open. */
export async function updateWorkoutRecord(
  userId: string,
  data: typeof updateWorkoutInputType.infer,
) {
  await requireOwnedWorkout(db, userId, data.id);
  if (data.finished === false) {
    await autoFinishIdleWorkouts(db, userId);
    await requireNoOpenWorkout(db, userId, data.id);
  }
  await db
    .update(workoutSessions)
    .set({
      ...(data.name?.trim() ? { name: data.name.trim() } : {}),
      ...(data.finished === undefined ? {} : { endedAt: data.finished ? new Date() : null }),
      updatedAt: new Date(),
    })
    .where(eq(workoutSessions.id, data.id));
  if (data.finished) await completeFilledSets(db, [data.id]);
}

export async function deleteWorkoutRecord(userId: string, data: IdInput) {
  await requireOwnedWorkout(db, userId, data.id);
  await db.delete(workoutSessions).where(eq(workoutSessions.id, data.id));
}

/** Finds the user's exercise with this name (any case) or creates it. */
async function findOrCreateExercise(
  tx: DbTransaction,
  userId: string,
  input: { name: string; measure: (typeof exerciseMeasures)[number] },
) {
  const name = input.name.trim();
  const [existing] = await tx
    .select({ id: workoutExercises.id })
    .from(workoutExercises)
    .where(
      and(
        eq(workoutExercises.userId, userId),
        sql`lower(${workoutExercises.name}) = lower(${name})`,
      ),
    );
  if (existing) {
    await tx
      .update(workoutExercises)
      .set({ archivedAt: null })
      .where(eq(workoutExercises.id, existing.id));
    return existing.id;
  }
  const [created] = await tx
    .insert(workoutExercises)
    .values({ measure: input.measure, name, userId })
    .returning({ id: workoutExercises.id });
  if (!created) throw new Error('Exercise insert returned no row.');
  return created.id;
}

/**
 * Appends an exercise to the session with as many empty sets as it had last time, so last time's
 * values show as ghosts in every row. Returns the new session exercise id.
 */
export async function addWorkoutExerciseRecord(
  userId: string,
  data: typeof addWorkoutExerciseInputType.infer,
) {
  return db.transaction(async (tx) => {
    const workout = await requireOwnedWorkout(tx, userId, data.workoutId);
    await touchWorkout(tx, workout.id);
    let exerciseId: string;
    if (data.exerciseId) {
      exerciseId = (await requireOwnedExercise(tx, userId, data.exerciseId)).id;
    } else if (data.newExercise) {
      exerciseId = await findOrCreateExercise(tx, userId, data.newExercise);
    } else {
      throw new ClientSafeError('Pick or name an exercise.');
    }

    const positions = await tx
      .select({ max: sql<number | null>`max(${workoutSessionExercises.position})` })
      .from(workoutSessionExercises)
      .where(eq(workoutSessionExercises.sessionId, workout.id));
    const [slot] = await tx
      .insert(workoutSessionExercises)
      .values({ exerciseId, position: nextPosition(positions), sessionId: workout.id })
      .returning({ id: workoutSessionExercises.id });
    if (!slot) throw new Error('Workout exercise insert returned no row.');

    const count = await previousSetCount(tx, userId, workout, exerciseId);
    await tx.insert(workoutSets).values(
      Array.from({ length: count }, (_, position) => ({
        position,
        sessionExerciseId: slot.id,
      })),
    );
    return { id: slot.id };
  });
}

export async function updateWorkoutExerciseRecord(
  userId: string,
  data: typeof updateWorkoutExerciseInputType.infer,
) {
  const slot = await requireOwnedSlot(db, userId, data.id);
  await touchWorkout(db, slot.workoutId);
  await db
    .update(workoutSessionExercises)
    .set({ notes: data.notes.trim() })
    .where(eq(workoutSessionExercises.id, data.id));
}

/** Swaps the slot with its neighbour; -1 parks one row so the unique position index holds. */
export async function moveWorkoutExerciseRecord(
  userId: string,
  data: typeof moveWorkoutExerciseInputType.infer,
) {
  await db.transaction(async (tx) => {
    const slot = await requireOwnedSlot(tx, userId, data.id);
    await touchWorkout(tx, slot.workoutId);
    const up = data.direction === 'up';
    const [neighbour] = await tx
      .select({ id: workoutSessionExercises.id, position: workoutSessionExercises.position })
      .from(workoutSessionExercises)
      .where(
        and(
          eq(workoutSessionExercises.sessionId, slot.workoutId),
          up
            ? lt(workoutSessionExercises.position, slot.position)
            : gt(workoutSessionExercises.position, slot.position),
        ),
      )
      .orderBy(up ? desc(workoutSessionExercises.position) : asc(workoutSessionExercises.position))
      .limit(1);
    if (!neighbour) return;
    const setPosition = (id: string, position: number) =>
      tx
        .update(workoutSessionExercises)
        .set({ position })
        .where(eq(workoutSessionExercises.id, id));
    await setPosition(slot.id, -1);
    await setPosition(neighbour.id, slot.position);
    await setPosition(slot.id, neighbour.position);
  });
}

export async function removeWorkoutExerciseRecord(userId: string, data: IdInput) {
  const slot = await requireOwnedSlot(db, userId, data.id);
  await touchWorkout(db, slot.workoutId);
  await db.delete(workoutSessionExercises).where(eq(workoutSessionExercises.id, data.id));
}

/** Appends a set copying the last one's type and values, the way people progress through sets. */
export async function addWorkoutSetRecord(
  userId: string,
  data: typeof addWorkoutSetInputType.infer,
) {
  return db.transaction(async (tx) => {
    const slot = await requireOwnedSlot(tx, userId, data.sessionExerciseId);
    await touchWorkout(tx, slot.workoutId);
    const [last] = await tx
      .select()
      .from(workoutSets)
      .where(eq(workoutSets.sessionExerciseId, slot.id))
      .orderBy(desc(workoutSets.position))
      .limit(1);
    const [created] = await tx
      .insert(workoutSets)
      .values({
        distanceMeters: last?.distanceMeters ?? null,
        durationSeconds: last?.durationSeconds ?? null,
        position: last ? last.position + 1 : 0,
        reps: last?.reps ?? null,
        type: last?.type ?? 'normal',
        weightGrams: last?.weightGrams ?? null,
        sessionExerciseId: slot.id,
      })
      .returning({ id: workoutSets.id });
    if (!created) throw new Error('Workout set insert returned no row.');
    return { id: created.id };
  });
}

/** Inserts a copy right below the set, shifting later sets down via negative positions. */
export async function duplicateWorkoutSetRecord(userId: string, data: IdInput) {
  return db.transaction(async (tx) => {
    const owned = await requireOwnedSet(tx, userId, data.id);
    await touchWorkout(tx, owned.workoutId);
    const [source] = await tx.select().from(workoutSets).where(eq(workoutSets.id, owned.id));
    if (!source) throw new ClientSafeError('Set not found.');
    const later = and(
      eq(workoutSets.sessionExerciseId, source.sessionExerciseId),
      gt(workoutSets.position, source.position),
    );
    await tx
      .update(workoutSets)
      .set({ position: sql`-(${workoutSets.position} + 1)` })
      .where(later);
    await tx
      .update(workoutSets)
      .set({ position: sql`-${workoutSets.position}` })
      .where(
        and(
          eq(workoutSets.sessionExerciseId, source.sessionExerciseId),
          lt(workoutSets.position, 0),
        ),
      );
    const [created] = await tx
      .insert(workoutSets)
      .values({
        distanceMeters: source.distanceMeters,
        durationSeconds: source.durationSeconds,
        position: source.position + 1,
        reps: source.reps,
        type: source.type,
        weightGrams: source.weightGrams,
        sessionExerciseId: source.sessionExerciseId,
      })
      .returning({ id: workoutSets.id });
    if (!created) throw new Error('Workout set insert returned no row.');
    return { id: created.id };
  });
}

export async function updateWorkoutSetRecord(
  userId: string,
  data: typeof updateWorkoutSetInputType.infer,
) {
  const owned = await requireOwnedSet(db, userId, data.id);
  await touchWorkout(db, owned.workoutId);
  const { done, id, type: setType, ...metrics } = data;
  const values = {
    ...toSetColumns(metrics),
    ...(setType === undefined ? {} : { type: setType }),
    ...(done === undefined ? {} : { completedAt: done ? new Date() : null }),
  };
  if (Object.keys(values).length === 0) return;
  await db.update(workoutSets).set(values).where(eq(workoutSets.id, id));
}

export async function deleteWorkoutSetRecord(userId: string, data: IdInput) {
  const owned = await requireOwnedSet(db, userId, data.id);
  await touchWorkout(db, owned.workoutId);
  await db.delete(workoutSets).where(eq(workoutSets.id, data.id));
}
