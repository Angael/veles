import { and, asc, eq, inArray } from 'drizzle-orm';
import { workoutExercises, workouts, workoutSets } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import type { DbTransaction } from '@/server/db.server';

export async function requireOwnedRoutine(tx: DbTransaction, userId: string, routineId: string) {
  const [routine] = await tx
    .select({ id: workouts.id, name: workouts.name })
    .from(workouts)
    .where(
      and(eq(workouts.id, routineId), eq(workouts.userId, userId), eq(workouts.kind, 'routine')),
    );
  if (!routine) throw new ClientSafeError('Routine not found.');
  return routine;
}

/**
 * Copies a workout's shape into another: exercises in order, how many sets each has, and the
 * set types. Values are left empty on purpose; last time's numbers already show what to aim for.
 */
export async function copyWorkoutStructure(tx: DbTransaction, fromId: string, toId: string) {
  const slots = await tx
    .select({
      exerciseId: workoutExercises.exerciseId,
      id: workoutExercises.id,
      restSeconds: workoutExercises.restSeconds,
    })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, fromId))
    .orderBy(asc(workoutExercises.position));
  if (slots.length === 0) return;

  const sets = await tx
    .select({ slotId: workoutSets.workoutExerciseId, type: workoutSets.type })
    .from(workoutSets)
    .where(
      inArray(
        workoutSets.workoutExerciseId,
        slots.map((slot) => slot.id),
      ),
    )
    .orderBy(asc(workoutSets.position));

  const created = await tx
    .insert(workoutExercises)
    .values(
      slots.map((slot, position) => ({
        exerciseId: slot.exerciseId,
        position,
        restSeconds: slot.restSeconds,
        workoutId: toId,
      })),
    )
    .returning({ id: workoutExercises.id, position: workoutExercises.position });
  const newIdByPosition = new Map(created.map((slot) => [slot.position, slot.id]));

  const rows = slots.flatMap((slot, position) => {
    const workoutExerciseId = newIdByPosition.get(position);
    if (!workoutExerciseId) return [];
    const types = sets.filter((set) => set.slotId === slot.id).map((set) => set.type);
    // Keep at least one row so the exercise is never an empty card.
    return (types.length > 0 ? types : (['normal'] as const)).map((type, index) => ({
      position: index,
      type,
      workoutExerciseId,
    }));
  });
  if (rows.length > 0) await tx.insert(workoutSets).values(rows);
}
