import { eq } from 'drizzle-orm';
import { workoutSessionExercises, workoutSessions, workoutSets } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db, type DbTransaction } from '@/server/db.server';
import { copyRoutineToSession, requireOwnedRoutine } from '../routines/routines.server';
import {
  autoFinishIdleWorkouts,
  completeFilledSets,
  defaultWorkoutName,
  requireNoOpenWorkout,
  requireOwnedWorkout,
  resolveExerciseId,
  toSetColumns,
} from '../workouts.server';
import type { saveWorkoutInputType } from '../workouts.validation';
import { workoutMovePatch } from './moveWorkout';

type SaveWorkoutInput = typeof saveWorkoutInputType.infer;

/** Replaces the session's exercises and sets with the given ones, in order. */
async function replaceExercises(
  tx: DbTransaction,
  userId: string,
  workoutId: string,
  exercises: NonNullable<SaveWorkoutInput['exercises']>,
) {
  await tx.delete(workoutSessionExercises).where(eq(workoutSessionExercises.sessionId, workoutId));
  const now = new Date();
  for (const [position, exercise] of exercises.entries()) {
    const exerciseId = await resolveExerciseId(tx, userId, exercise);
    const [slot] = await tx
      .insert(workoutSessionExercises)
      .values({ exerciseId, notes: exercise.notes?.trim() ?? '', position, sessionId: workoutId })
      .returning({ id: workoutSessionExercises.id });
    if (!slot) throw new Error('Workout exercise insert returned no row.');
    if (exercise.sets.length === 0) continue;
    await tx.insert(workoutSets).values(
      exercise.sets.map(({ done, type, ...metrics }, index) => ({
        ...toSetColumns(metrics),
        completedAt: done ? now : null,
        position: index,
        sessionExerciseId: slot.id,
        type: type ?? 'normal',
      })),
    );
  }
}

/**
 * Creates or updates a whole session in one transaction, so an agent can log a workout from chat
 * in one call instead of building it set by set. Omitted fields stay as they are; given exercises
 * replace all exercises and sets. A new session is finished unless `finished` is false, and copies
 * the routine's exercises when it names a routine but no exercises.
 */
export async function saveWorkoutRecord(userId: string, data: SaveWorkoutInput) {
  return db.transaction(async (tx) => {
    const opening = data.finished === false;
    if (opening) await autoFinishIdleWorkouts(tx, userId);
    const routine = data.routineId ? await requireOwnedRoutine(tx, userId, data.routineId) : null;
    const now = new Date();
    let workoutId: string;
    let finished = !opening;

    if (data.id) {
      const workout = await requireOwnedWorkout(tx, userId, data.id);
      workoutId = workout.id;
      if (opening) await requireNoOpenWorkout(tx, userId, workoutId);
      const [updated] = await tx
        .update(workoutSessions)
        .set({
          ...(data.date ? workoutMovePatch(workout, data.date, defaultWorkoutName) : null),
          ...(data.name?.trim() ? { name: data.name.trim() } : {}),
          ...(data.routineId === undefined ? {} : { routineId: routine?.id ?? null }),
          ...(data.finished === undefined ? {} : { endedAt: data.finished ? now : null }),
          updatedAt: now,
        })
        .where(eq(workoutSessions.id, workoutId))
        .returning({ endedAt: workoutSessions.endedAt });
      finished = Boolean(updated?.endedAt);
    } else {
      if (!data.date) throw new ClientSafeError('A new workout needs a date.');
      if (opening) await requireNoOpenWorkout(tx, userId);
      const [created] = await tx
        .insert(workoutSessions)
        .values({
          date: data.date,
          endedAt: opening ? null : now,
          name: data.name?.trim() || routine?.name || defaultWorkoutName(data.date),
          routineId: routine?.id ?? null,
          startedAt: opening ? now : null,
          userId,
        })
        .returning({ id: workoutSessions.id });
      if (!created) throw new Error('Workout insert returned no row.');
      workoutId = created.id;
      if (!data.exercises && routine) await copyRoutineToSession(tx, routine.id, workoutId);
    }

    if (data.exercises) await replaceExercises(tx, userId, workoutId, data.exercises);
    // Sets of a finished session count as done once they have values, as in the app.
    if (finished) await completeFilledSets(tx, [workoutId]);
    return { id: workoutId };
  });
}
