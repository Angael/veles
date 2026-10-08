import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, gt, lt, sql } from 'drizzle-orm';
import { exerciseMeasures, exercises, workoutExercises, workoutSets } from '@veles/db/schema';
import { db, type DbTransaction } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import {
  nextPosition,
  previousSetCount,
  requireOwnedExercise,
  requireOwnedSet,
  requireOwnedSlot,
  requireOwnedWorkout,
  toSetColumns,
  touchWorkout,
} from '../workouts.server';

const idInputType = type({ id: 'string.uuid' });

const addWorkoutExerciseInputType = type({
  workoutId: 'string.uuid',
  'exerciseId?': 'string.uuid',
  /** Creates the exercise (or reuses one with the same name) when no id is given. */
  'newExercise?': {
    name: '0 < string <= 200',
    measure: type.enumerated(...exerciseMeasures),
  },
});

/** Finds the user's exercise with this name (any case) or creates it. */
async function findOrCreateExercise(
  tx: DbTransaction,
  userId: string,
  input: { name: string; measure: (typeof exerciseMeasures)[number] },
) {
  const name = input.name.trim();
  const [existing] = await tx
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(eq(exercises.userId, userId), sql`lower(${exercises.name}) = lower(${name})`));
  if (existing) {
    await tx.update(exercises).set({ archivedAt: null }).where(eq(exercises.id, existing.id));
    return existing.id;
  }
  const [created] = await tx
    .insert(exercises)
    .values({ measure: input.measure, name, userId })
    .returning({ id: exercises.id });
  if (!created) throw new Error('Exercise insert returned no row.');
  return created.id;
}

/**
 * Appends an exercise to the session with as many empty sets as it had last time, so last time's
 * values show as ghosts in every row.
 */
export const addWorkoutExercise = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('addWorkoutExercise')])
  .validator(arkTypeValidator(addWorkoutExerciseInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;
    await db.transaction(async (tx) => {
      const workout = await requireOwnedWorkout(tx, userId, data.workoutId);
      await touchWorkout(tx, workout.id);
      let exerciseId: string;
      if (data.exerciseId) {
        exerciseId = (await requireOwnedExercise(tx, userId, data.exerciseId)).id;
      } else if (data.newExercise) {
        exerciseId = await findOrCreateExercise(tx, userId, data.newExercise);
      } else {
        throw new Error('Pick or name an exercise.');
      }

      const positions = await tx
        .select({ max: sql<number | null>`max(${workoutExercises.position})` })
        .from(workoutExercises)
        .where(eq(workoutExercises.workoutId, workout.id));
      const [slot] = await tx
        .insert(workoutExercises)
        .values({ exerciseId, position: nextPosition(positions), workoutId: workout.id })
        .returning({ id: workoutExercises.id });
      if (!slot) throw new Error('Workout exercise insert returned no row.');

      const count = await previousSetCount(tx, userId, workout, exerciseId);
      await tx.insert(workoutSets).values(
        Array.from({ length: count }, (_, position) => ({
          position,
          workoutExerciseId: slot.id,
        })),
      );
    });
  });

const updateWorkoutExerciseInputType = type({ id: 'string.uuid', notes: 'string <= 2000' });

export const updateWorkoutExercise = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateWorkoutExercise')])
  .validator(arkTypeValidator(updateWorkoutExerciseInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const slot = await requireOwnedSlot(db, session.user.id, data.id);
    await touchWorkout(db, slot.workoutId);
    await db
      .update(workoutExercises)
      .set({ notes: data.notes.trim() })
      .where(eq(workoutExercises.id, data.id));
  });

const moveWorkoutExerciseInputType = type({
  id: 'string.uuid',
  direction: "'up' | 'down'",
});

/** Swaps the slot with its neighbour; -1 parks one row so the unique position index holds. */
export const moveWorkoutExercise = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('moveWorkoutExercise')])
  .validator(arkTypeValidator(moveWorkoutExerciseInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db.transaction(async (tx) => {
      const slot = await requireOwnedSlot(tx, session.user.id, data.id);
      await touchWorkout(tx, slot.workoutId);
      const up = data.direction === 'up';
      const [neighbour] = await tx
        .select({ id: workoutExercises.id, position: workoutExercises.position })
        .from(workoutExercises)
        .where(
          and(
            eq(workoutExercises.workoutId, slot.workoutId),
            up
              ? lt(workoutExercises.position, slot.position)
              : gt(workoutExercises.position, slot.position),
          ),
        )
        .orderBy(up ? desc(workoutExercises.position) : asc(workoutExercises.position))
        .limit(1);
      if (!neighbour) return;
      const setPosition = (id: string, position: number) =>
        tx.update(workoutExercises).set({ position }).where(eq(workoutExercises.id, id));
      await setPosition(slot.id, -1);
      await setPosition(neighbour.id, slot.position);
      await setPosition(slot.id, neighbour.position);
    });
  });

export const removeWorkoutExercise = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('removeWorkoutExercise')])
  .validator(arkTypeValidator(idInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const slot = await requireOwnedSlot(db, session.user.id, data.id);
    await touchWorkout(db, slot.workoutId);
    await db.delete(workoutExercises).where(eq(workoutExercises.id, data.id));
  });

const addWorkoutSetInputType = type({ workoutExerciseId: 'string.uuid' });

/** Appends a set copying the last one's type and values, the way people progress through sets. */
export const addWorkoutSet = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('addWorkoutSet')])
  .validator(arkTypeValidator(addWorkoutSetInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db.transaction(async (tx) => {
      const slot = await requireOwnedSlot(tx, session.user.id, data.workoutExerciseId);
      await touchWorkout(tx, slot.workoutId);
      const [last] = await tx
        .select()
        .from(workoutSets)
        .where(eq(workoutSets.workoutExerciseId, slot.id))
        .orderBy(desc(workoutSets.position))
        .limit(1);
      await tx.insert(workoutSets).values({
        distanceMeters: last?.distanceMeters ?? null,
        durationSeconds: last?.durationSeconds ?? null,
        position: last ? last.position + 1 : 0,
        reps: last?.reps ?? null,
        type: last?.type ?? 'normal',
        weightGrams: last?.weightGrams ?? null,
        workoutExerciseId: slot.id,
      });
    });
  });

/** Inserts a copy right below the set, shifting later sets down via negative positions. */
export const duplicateWorkoutSet = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('duplicateWorkoutSet')])
  .validator(arkTypeValidator(idInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db.transaction(async (tx) => {
      const owned = await requireOwnedSet(tx, session.user.id, data.id);
      await touchWorkout(tx, owned.workoutId);
      const [source] = await tx.select().from(workoutSets).where(eq(workoutSets.id, owned.id));
      if (!source) return;
      const later = and(
        eq(workoutSets.workoutExerciseId, source.workoutExerciseId),
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
            eq(workoutSets.workoutExerciseId, source.workoutExerciseId),
            lt(workoutSets.position, 0),
          ),
        );
      await tx.insert(workoutSets).values({
        distanceMeters: source.distanceMeters,
        durationSeconds: source.durationSeconds,
        position: source.position + 1,
        reps: source.reps,
        type: source.type,
        weightGrams: source.weightGrams,
        workoutExerciseId: source.workoutExerciseId,
      });
    });
  });

const metric = 'number >= 0 | null';

const updateWorkoutSetInputType = type({
  id: 'string.uuid',
  'type?': "'normal' | 'warmup' | 'drop' | 'failure'",
  'weightKg?': metric,
  'reps?': '(number.integer >= 0) | null',
  'durationSeconds?': metric,
  'distanceKm?': metric,
  'done?': 'boolean',
});

export const updateWorkoutSet = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateWorkoutSet')])
  .validator(arkTypeValidator(updateWorkoutSetInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const owned = await requireOwnedSet(db, session.user.id, data.id);
    await touchWorkout(db, owned.workoutId);
    const { done, id, type: setType, ...metrics } = data;
    const values = {
      ...toSetColumns(metrics),
      ...(setType === undefined ? {} : { type: setType }),
      ...(done === undefined ? {} : { completedAt: done ? new Date() : null }),
    };
    if (Object.keys(values).length === 0) return;
    await db.update(workoutSets).set(values).where(eq(workoutSets.id, id));
  });

export const deleteWorkoutSet = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteWorkoutSet')])
  .validator(arkTypeValidator(idInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const owned = await requireOwnedSet(db, session.user.id, data.id);
    await touchWorkout(db, owned.workoutId);
    await db.delete(workoutSets).where(eq(workoutSets.id, data.id));
  });
