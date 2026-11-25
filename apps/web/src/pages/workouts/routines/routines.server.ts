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

/** Column changes shared by the app and agents: trimmed name and description, archive state. */
function routineChanges(data: { name?: string; description?: string; archived?: boolean }) {
  return {
    ...(data.name?.trim() ? { name: data.name.trim() } : {}),
    ...(data.description === undefined ? {} : { description: data.description.trim() }),
    ...(data.archived === undefined ? {} : { archivedAt: data.archived ? new Date() : null }),
    updatedAt: new Date(),
  };
}
import type { SetType } from '../metrics';
import {
  autoFinishIdleWorkouts,
  type ExerciseRef,
  requireNoOpenWorkout,
  requireOwnedWorkout,
  resolveExerciseId,
} from '../workouts.server';
import type {
  saveRoutineInputType,
  saveRoutinePlanInputType,
  startRoutineInputType,
  updateRoutineFromWorkoutInputType,
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
 * are dropped on purpose; last time's numbers already show what to aim for. Refuses an empty
 * session, so a routine is never saved without exercises.
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
  if (slots.length === 0)
    throw new ClientSafeError(
      translate({
        en: 'Add an exercise before saving a routine.',
        pl: 'Dodaj ćwiczenie przed zapisaniem planu.',
      }),
    );

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

type RoutinePlan = { exerciseId: string; setTypes: SetType[] }[];

/** Two plans match when they list the same exercises in the same order with the same set types. */
export function samePlan(a: RoutinePlan, b: RoutinePlan) {
  return (
    a.length === b.length &&
    a.every((exercise, index) => {
      const other = b[index];
      return (
        other?.exerciseId === exercise.exerciseId &&
        other.setTypes.length === exercise.setTypes.length &&
        other.setTypes.every((type, setIndex) => type === exercise.setTypes[setIndex])
      );
    })
  );
}

/**
 * Writes the plan the user reviewed on Finish to the routine the workout started from, but only
 * if that routine still is what the review showed as "before": same link and same exercises.
 * Otherwise it writes nothing and reports a conflict, so a routine edited elsewhere (another tab,
 * an agent) meanwhile is never replaced by a stale plan. The routine row is locked first, so an
 * edit committing at the same moment is either seen here or waits for this write. Name,
 * description and archive changes do not conflict; they are kept.
 */
export async function updateRoutineFromWorkoutRecord(
  userId: string,
  data: typeof updateRoutineFromWorkoutInputType.infer,
): Promise<{ conflict: boolean }> {
  return db.transaction(async (tx) => {
    const workout = await requireOwnedWorkout(tx, userId, data.workoutId);
    const [linked] = await tx
      .select({ routineId: workoutSessions.routineId })
      .from(workoutSessions)
      .where(eq(workoutSessions.id, workout.id));
    if (linked?.routineId !== data.routineId) return { conflict: true };
    const [routine] = await tx
      .select({ id: workoutRoutines.id })
      .from(workoutRoutines)
      .where(and(eq(workoutRoutines.id, data.routineId), eq(workoutRoutines.userId, userId)))
      .for('update');
    if (!routine) return { conflict: true };
    const current = await tx
      .select({
        exerciseId: workoutRoutineExercises.exerciseId,
        setTypes: workoutRoutineExercises.setTypes,
      })
      .from(workoutRoutineExercises)
      .where(eq(workoutRoutineExercises.routineId, routine.id))
      .orderBy(asc(workoutRoutineExercises.position));
    if (!samePlan(current, data.reviewed)) return { conflict: true };

    await replaceRoutineExercises(tx, userId, routine.id, data.exercises);
    await tx
      .update(workoutRoutines)
      .set({ updatedAt: new Date() })
      .where(eq(workoutRoutines.id, routine.id));
    return { conflict: false };
  });
}

/** Replaces the routine's exercises with the given ones, in order. Exercises must be the user's. */
async function replaceRoutineExercises(
  tx: DbTransaction,
  userId: string,
  routineId: string,
  exercises: (ExerciseRef & { setTypes: SetType[] })[],
) {
  await tx.delete(workoutRoutineExercises).where(eq(workoutRoutineExercises.routineId, routineId));
  for (const [position, exercise] of exercises.entries()) {
    const exerciseId = await resolveExerciseId(tx, userId, exercise);
    await tx
      .insert(workoutRoutineExercises)
      .values({ exerciseId, position, routineId, setTypes: exercise.setTypes });
  }
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
      .set(routineChanges(data))
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
        .set(routineChanges(data))
        .where(eq(workoutRoutines.id, routineId));
    } else {
      if (!data.name?.trim()) throw new ClientSafeError('A new routine needs a name.');
      const [created] = await tx
        .insert(workoutRoutines)
        .values({
          archivedAt: data.archived ? new Date() : null,
          description: data.description?.trim() ?? '',
          name: data.name.trim(),
          userId,
        })
        .returning({ id: workoutRoutines.id });
      if (!created) throw new Error('Routine insert returned no row.');
      routineId = created.id;
    }

    if (data.exercises) await replaceRoutineExercises(tx, userId, routineId, data.exercises);
    return { id: routineId };
  });
}
