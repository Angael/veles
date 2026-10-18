import { and, asc, eq, inArray } from 'drizzle-orm';
import {
  workoutRoutineExercises,
  workoutRoutines,
  workoutSessionExercises,
  workoutSets,
} from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import type { DbTransaction } from '@/server/db.server';

export async function requireOwnedRoutine(tx: DbTransaction, userId: string, routineId: string) {
  const [routine] = await tx
    .select({ id: workoutRoutines.id, name: workoutRoutines.name })
    .from(workoutRoutines)
    .where(and(eq(workoutRoutines.id, routineId), eq(workoutRoutines.userId, userId)));
  if (!routine) throw new ClientSafeError('Routine not found.');
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
