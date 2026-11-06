import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { type WorkoutNextSet, workoutExercises } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { translate } from '@/lib/i18n/getLocale';
import { db, type DbTransaction } from '@/server/db.server';
import type { Measure } from '../metrics';
import type { setNextSetsInputType } from '../workouts.validation';
import { fromNextSets, nextSetsProblem, toNextSets } from './nextSets';

/**
 * Saves (or clears with `null`) the sets prefilled the next time the user adds this exercise to
 * a workout. Replaces any earlier prescription; clearing one that does not exist is a no-op.
 */
export async function setNextSetsRecord(userId: string, data: typeof setNextSetsInputType.infer) {
  const owned = and(eq(workoutExercises.id, data.exerciseId), eq(workoutExercises.userId, userId));
  const [exercise] = await db
    .select({ measure: workoutExercises.measure })
    .from(workoutExercises)
    .where(owned);
  if (!exercise)
    throw new ClientSafeError(
      translate({ en: 'Exercise not found.', pl: 'Nie znaleziono ćwiczenia.' }),
    );
  const problem = data.sets && nextSetsProblem(exercise.measure, data.sets);
  if (problem) throw new ClientSafeError(problem);

  const nextSets = data.sets && toNextSets(data.sets);
  await db.update(workoutExercises).set({ nextSets }).where(owned);
  return { id: data.exerciseId, nextSets: nextSets && fromNextSets(nextSets) };
}

/**
 * Reads and clears the user's pending prescriptions for these exercises inside the caller's
 * transaction, so a failed add rolls back and keeps them for the next try.
 */
export async function takeNextSets(tx: DbTransaction, userId: string, exerciseIds: string[]) {
  const taken = new Map<string, { measure: Measure; sets: WorkoutNextSet[] }>();
  if (exerciseIds.length === 0) return taken;
  const rows = await tx
    .select({
      id: workoutExercises.id,
      measure: workoutExercises.measure,
      nextSets: workoutExercises.nextSets,
    })
    .from(workoutExercises)
    .where(
      and(
        eq(workoutExercises.userId, userId),
        inArray(workoutExercises.id, exerciseIds),
        isNotNull(workoutExercises.nextSets),
      ),
    )
    .for('update');
  if (rows.length === 0) return taken;
  await tx
    .update(workoutExercises)
    .set({ nextSets: null })
    .where(
      and(
        eq(workoutExercises.userId, userId),
        inArray(
          workoutExercises.id,
          rows.map((row) => row.id),
        ),
      ),
    );
  for (const row of rows) {
    if (row.nextSets?.length) taken.set(row.id, { measure: row.measure, sets: row.nextSets });
  }
  return taken;
}
