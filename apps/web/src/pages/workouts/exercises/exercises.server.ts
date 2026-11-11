import { and, asc, eq, ne, sql } from 'drizzle-orm';
import {
  workoutExercises,
  workoutRoutineExercises,
  workoutSessionExercises,
  workoutSessions,
} from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/server/db.server';
import type { Measure } from '../metrics';
import { requireOwnedExercise } from '../workouts.server';
import type { updateExerciseInputType } from '../workouts.validation';
import { translate } from '@/lib/i18n/getLocale';

/** Rename, tracking mode, rest length and archiving belong to the exercise, so they carry to next time. */
export async function updateExerciseRecord(
  userId: string,
  data: typeof updateExerciseInputType.infer,
) {
  await requireOwnedExercise(db, userId, data.id);
  const name = data.name?.trim();
  if (name) {
    const [clash] = await db
      .select({ id: workoutExercises.id })
      .from(workoutExercises)
      .where(
        and(
          eq(workoutExercises.userId, userId),
          ne(workoutExercises.id, data.id),
          sql`lower(${workoutExercises.name}) = lower(${name})`,
        ),
      );
    if (clash)
      throw new ClientSafeError(
        translate({
          en: `You already have an exercise called “${name}”.`,
          pl: `Masz już ćwiczenie o nazwie „${name}”.`,
        }),
      );
  }
  await db
    .update(workoutExercises)
    .set({
      ...(name ? { name } : {}),
      ...(data.measure === undefined ? {} : { measure: data.measure }),
      ...(data.restSeconds === undefined ? {} : { restSeconds: data.restSeconds }),
      ...(data.archived === undefined ? {} : { archivedAt: data.archived ? new Date() : null }),
      updatedAt: new Date(),
    })
    .where(eq(workoutExercises.id, data.id));
}

/** One exercise on the exercise list page, with how much it is used. */
export type ExerciseLibraryEntry = {
  id: string;
  name: string;
  measure: Measure;
  restSeconds: number | null;
  archived: boolean;
  /** Workouts that include this exercise. */
  sessionCount: number;
  routineCount: number;
  lastDate: string | null;
};

/**
 * Every exercise of the user, archived ones too, with usage counts. Subqueries keep the session
 * and routine counts from multiplying each other, as two joins would.
 */
export async function listExerciseLibrary(userId: string): Promise<ExerciseLibraryEntry[]> {
  const rows = await db
    .select({
      archivedAt: workoutExercises.archivedAt,
      id: workoutExercises.id,
      lastDate: sql<string | null>`(
        SELECT max(${workoutSessions.date})::text FROM ${workoutSessionExercises}
        INNER JOIN ${workoutSessions} ON ${workoutSessions.id} = ${workoutSessionExercises.sessionId}
        WHERE ${workoutSessionExercises.exerciseId} = ${workoutExercises.id}
      )`,
      measure: workoutExercises.measure,
      name: workoutExercises.name,
      restSeconds: workoutExercises.restSeconds,
      routineCount: sql<number>`(
        SELECT count(DISTINCT ${workoutRoutineExercises.routineId})::int FROM ${workoutRoutineExercises}
        WHERE ${workoutRoutineExercises.exerciseId} = ${workoutExercises.id}
      )`,
      sessionCount: sql<number>`(
        SELECT count(DISTINCT ${workoutSessionExercises.sessionId})::int FROM ${workoutSessionExercises}
        WHERE ${workoutSessionExercises.exerciseId} = ${workoutExercises.id}
      )`,
    })
    .from(workoutExercises)
    .where(eq(workoutExercises.userId, userId))
    .orderBy(asc(sql`lower(${workoutExercises.name})`));
  return rows.map(({ archivedAt, ...row }) => ({ ...row, archived: archivedAt !== null }));
}

/**
 * Deletes an exercise that no workout or routine uses, e.g. a typo. Used exercises must be
 * archived instead, so history and routines never lose an exercise.
 */
export async function deleteExerciseRecord(userId: string, data: { id: string }) {
  await db.transaction(async (tx) => {
    await requireOwnedExercise(tx, userId, data.id);
    const [inSessions, inRoutines] = await Promise.all([
      tx
        .select({ id: workoutSessionExercises.id })
        .from(workoutSessionExercises)
        .where(eq(workoutSessionExercises.exerciseId, data.id))
        .limit(1),
      tx
        .select({ id: workoutRoutineExercises.id })
        .from(workoutRoutineExercises)
        .where(eq(workoutRoutineExercises.exerciseId, data.id))
        .limit(1),
    ]);
    if (inSessions.length > 0 || inRoutines.length > 0)
      throw new ClientSafeError(
        translate({
          en: 'This exercise is in workouts or routines. Archive it instead.',
          pl: 'To ćwiczenie jest w treningach lub planach. Zarchiwizuj je zamiast tego.',
        }),
      );
    await tx
      .delete(workoutExercises)
      .where(and(eq(workoutExercises.id, data.id), eq(workoutExercises.userId, userId)));
  });
}
