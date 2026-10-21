import { and, asc, eq, inArray } from 'drizzle-orm';
import {
  workoutRoutineExercises,
  workoutRoutines,
  workoutSessionExercises,
  workoutSessions,
  workoutSets,
} from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db, type DbTransaction } from '@/server/db.server';
import {
  autoFinishIdleWorkouts,
  requireNoOpenWorkout,
  requireOwnedWorkout,
  resolveExerciseId,
} from '../workouts.server';
import type {
  routineWorkoutIdInputType,
  saveRoutineInputType,
  saveRoutinePlanInputType,
  startRoutineInputType,
  updateRoutineInputType,
  workoutIdType,
} from '../workouts.validation';
import { translate } from '@/lib/i18n/getLocale';

export async function requireOwnedRoutine(tx: DbTransaction, userId: string, routineId: string) {
  const [routine] = await tx
    .select({ id: workoutRoutines.id, name: workoutRoutines.name })
    .from(workoutRoutines)
    .where(and(eq(workoutRoutines.id, routineId), eq(workoutRoutines.userId, userId)));
  if (!routine)
    throw new ClientSafeError(translate({ en: 'Routine not found.', pl: 'Nie znaleziono planu.' }));
  return routine;
}

/**
 * Stores a session's shape in a routine: exercises in order and the set types of each. Values
 * are dropped on purpose; last time's numbers already show what to aim for.
 */
export async function copySessionToRoutine(
  tx: DbTransaction,
  sessionId: string,
  routineId: string,
) {
  const slots = await tx
    .select({ exerciseId: workoutSessionExercises.exerciseId, id: workoutSessionExercises.id })
    .from(workoutSessionExercises)
    .where(eq(workoutSessionExercises.sessionId, sessionId))
    .orderBy(asc(workoutSessionExercises.position));
  if (slots.length === 0) return;

  const sets = await tx
    .select({ slotId: workoutSets.sessionExerciseId, type: workoutSets.type })
    .from(workoutSets)
    .where(
      inArray(
        workoutSets.sessionExerciseId,
        slots.map((slot) => slot.id),
      ),
    )
    .orderBy(asc(workoutSets.position));

  await tx.insert(workoutRoutineExercises).values(
    slots.map((slot, position) => {
      const setTypes = sets.filter((set) => set.slotId === slot.id).map((set) => set.type);
      // Keep at least one set so the exercise is never an empty card.
      return {
        exerciseId: slot.exerciseId,
        position,
        routineId,
        setTypes: setTypes.length > 0 ? setTypes : ['normal' as const],
      };
    }),
  );
}

/** Fills a new session with the routine's exercises and one empty set per stored set type. */
export async function copyRoutineToSession(
  tx: DbTransaction,
  routineId: string,
  sessionId: string,
) {
  const slots = await tx
    .select({
      exerciseId: workoutRoutineExercises.exerciseId,
      setTypes: workoutRoutineExercises.setTypes,
    })
    .from(workoutRoutineExercises)
    .where(eq(workoutRoutineExercises.routineId, routineId))
    .orderBy(asc(workoutRoutineExercises.position));
  if (slots.length === 0) return;

  const created = await tx
    .insert(workoutSessionExercises)
    .values(slots.map((slot, position) => ({ exerciseId: slot.exerciseId, position, sessionId })))
    .returning({ id: workoutSessionExercises.id, position: workoutSessionExercises.position });
  const newIdByPosition = new Map(created.map((slot) => [slot.position, slot.id]));

  const rows = slots.flatMap((slot, position) => {
    const sessionExerciseId = newIdByPosition.get(position);
    if (!sessionExerciseId) return [];
    return slot.setTypes.map((type, index) => ({ position: index, sessionExerciseId, type }));
  });
  if (rows.length > 0) await tx.insert(workoutSets).values(rows);
}

/** Saves the session's exercises as a new routine and links the session to it. */
export async function saveRoutineFromWorkoutRecord(
  userId: string,
  data: typeof saveRoutineInputType.infer,
) {
  return db.transaction(async (tx) => {
    const workout = await requireOwnedWorkout(tx, userId, data.workoutId);
    const [routine] = await tx
      .insert(workoutRoutines)
      .values({
        description: data.description?.trim() ?? '',
        name: data.name.trim(),
        userId,
      })
      .returning({ id: workoutRoutines.id });
    if (!routine) throw new Error('Routine insert returned no row.');
    await copySessionToRoutine(tx, workout.id, routine.id);
    await tx
      .update(workoutSessions)
      .set({ routineId: routine.id })
      .where(eq(workoutSessions.id, workout.id));
    return { id: routine.id };
  });
}

/** Overwrites the linked routine's exercises with this session's. */
export async function updateRoutineFromWorkoutRecord(
  userId: string,
  data: typeof routineWorkoutIdInputType.infer,
) {
  await db.transaction(async (tx) => {
    const workout = await requireOwnedWorkout(tx, userId, data.workoutId);
    const [linked] = await tx
      .select({ routineId: workoutSessions.routineId })
      .from(workoutSessions)
      .where(eq(workoutSessions.id, workout.id));
    if (!linked?.routineId)
      throw new ClientSafeError(
        translate({ en: 'This workout has no routine.', pl: 'Ten trening nie ma planu.' }),
      );
    const routine = await requireOwnedRoutine(tx, userId, linked.routineId);
    await tx
      .delete(workoutRoutineExercises)
      .where(eq(workoutRoutineExercises.routineId, routine.id));
    await copySessionToRoutine(tx, workout.id, routine.id);
    await tx
      .update(workoutRoutines)
      .set({ updatedAt: new Date() })
      .where(eq(workoutRoutines.id, routine.id));
  });
}

/** Starts a session for the given day with the routine's exercises and empty sets. */
export async function startRoutineRecord(userId: string, data: typeof startRoutineInputType.infer) {
  return db.transaction(async (tx) => {
    const routine = await requireOwnedRoutine(tx, userId, data.routineId);
    await autoFinishIdleWorkouts(tx, userId);
    await requireNoOpenWorkout(tx, userId);
    const [workout] = await tx
      .insert(workoutSessions)
      .values({
        date: data.date,
        name: routine.name,
        routineId: routine.id,
        startedAt: new Date(),
        userId,
      })
      .returning({ id: workoutSessions.id });
    if (!workout) throw new Error('Workout insert returned no row.');
    await copyRoutineToSession(tx, routine.id, workout.id);
    return { id: workout.id };
  });
}

export async function updateRoutineRecord(
  userId: string,
  data: typeof updateRoutineInputType.infer,
) {
  await db.transaction(async (tx) => {
    await requireOwnedRoutine(tx, userId, data.id);
    await tx
      .update(workoutRoutines)
      .set({
        ...(data.name?.trim() ? { name: data.name.trim() } : {}),
        ...(data.description === undefined ? {} : { description: data.description.trim() }),
        updatedAt: new Date(),
      })
      .where(eq(workoutRoutines.id, data.id));
  });
}

/** Deletes the routine only; sessions started from it keep their sets and lose the link. */
export async function deleteRoutineRecord(userId: string, data: typeof workoutIdType.infer) {
  await db.transaction(async (tx) => {
    await requireOwnedRoutine(tx, userId, data.id);
    await tx.delete(workoutRoutines).where(eq(workoutRoutines.id, data.id));
  });
}

/**
 * Creates or updates a routine with its whole plan in one transaction, so agents can write a
 * routine directly instead of building a workout and saving it. Omitted fields stay; given
 * exercises replace the routine's exercises.
 */
export async function saveRoutinePlanRecord(
  userId: string,
  data: typeof saveRoutinePlanInputType.infer,
) {
  return db.transaction(async (tx) => {
    let routineId: string;
    if (data.id) {
      routineId = (await requireOwnedRoutine(tx, userId, data.id)).id;
      await tx
        .update(workoutRoutines)
        .set({
          ...(data.name?.trim() ? { name: data.name.trim() } : {}),
          ...(data.description === undefined ? {} : { description: data.description.trim() }),
          updatedAt: new Date(),
        })
        .where(eq(workoutRoutines.id, routineId));
    } else {
      if (!data.name?.trim()) throw new ClientSafeError('A new routine needs a name.');
      const [created] = await tx
        .insert(workoutRoutines)
        .values({ description: data.description?.trim() ?? '', name: data.name.trim(), userId })
        .returning({ id: workoutRoutines.id });
      if (!created) throw new Error('Routine insert returned no row.');
      routineId = created.id;
    }

    if (data.exercises) {
      await tx
        .delete(workoutRoutineExercises)
        .where(eq(workoutRoutineExercises.routineId, routineId));
      for (const [position, exercise] of data.exercises.entries()) {
        const exerciseId = await resolveExerciseId(tx, userId, exercise);
        await tx
          .insert(workoutRoutineExercises)
          .values({ exerciseId, position, routineId, setTypes: exercise.setTypes });
      }
    }
    return { id: routineId };
  });
}
