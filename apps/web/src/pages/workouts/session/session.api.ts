import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, gt, lt, sql } from 'drizzle-orm';
import {
  exerciseMeasures,
  workoutExercises,
  workoutSessionExercises,
  workoutSets,
} from '@veles/db/schema';
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
import { MAX_WEIGHT_KG } from '../metrics';

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
      .update(workoutSessionExercises)
      .set({ notes: data.notes.trim() })
      .where(eq(workoutSessionExercises.id, data.id));
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
        .orderBy(
          up ? desc(workoutSessionExercises.position) : asc(workoutSessionExercises.position),
        )
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
  });

export const removeWorkoutExercise = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('removeWorkoutExercise')])
  .validator(arkTypeValidator(idInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const slot = await requireOwnedSlot(db, session.user.id, data.id);
    await touchWorkout(db, slot.workoutId);
    await db.delete(workoutSessionExercises).where(eq(workoutSessionExercises.id, data.id));
  });

const addWorkoutSetInputType = type({ sessionExerciseId: 'string.uuid' });

/** Appends a set copying the last one's type and values, the way people progress through sets. */
export const addWorkoutSet = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('addWorkoutSet')])
  .validator(arkTypeValidator(addWorkoutSetInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db.transaction(async (tx) => {
      const slot = await requireOwnedSlot(tx, session.user.id, data.sessionExerciseId);
      await touchWorkout(tx, slot.workoutId);
      const [last] = await tx
        .select()
        .from(workoutSets)
        .where(eq(workoutSets.sessionExerciseId, slot.id))
        .orderBy(desc(workoutSets.position))
        .limit(1);
      await tx.insert(workoutSets).values({
        distanceMeters: last?.distanceMeters ?? null,
        durationSeconds: last?.durationSeconds ?? null,
        position: last ? last.position + 1 : 0,
        reps: last?.reps ?? null,
        type: last?.type ?? 'normal',
        weightGrams: last?.weightGrams ?? null,
        sessionExerciseId: slot.id,
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
      await tx.insert(workoutSets).values({
        distanceMeters: source.distanceMeters,
        durationSeconds: source.durationSeconds,
        position: source.position + 1,
        reps: source.reps,
        type: source.type,
        weightGrams: source.weightGrams,
        sessionExerciseId: source.sessionExerciseId,
      });
    });
  });

const metric = 'number >= 0 | null';

const updateWorkoutSetInputType = type({
  id: 'string.uuid',
  'type?': "'normal' | 'warmup' | 'drop' | 'failure'",
  'weightKg?': `(0 <= number <= ${MAX_WEIGHT_KG}) | null`,
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
