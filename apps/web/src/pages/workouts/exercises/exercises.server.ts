import { and, eq, ne, sql } from 'drizzle-orm';
import { workoutExercises } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/server/db.server';
import { requireOwnedExercise } from '../workouts.server';
import type { updateExerciseInputType } from '../workouts.validation';
import { translate } from '@/lib/i18n/getLocale';

/** Rename, tracking mode and rest length belong to the exercise, so they carry to next time. */
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
      updatedAt: new Date(),
    })
    .where(eq(workoutExercises.id, data.id));
}
