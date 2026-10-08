import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { exercises, workoutExercises, workouts } from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { requireOwnedWorkout } from '../workouts.server';
import { copyWorkoutStructure, requireOwnedRoutine } from './routines.server';

export type RoutineSummary = {
  id: string;
  name: string;
  description: string;
  exerciseNames: string[];
  lastUsed: string | null;
};

const name = '0 < string <= 200';
const description = 'string <= 2000';

/** Routines with their exercise names, most recently used first. */
export const getRoutines = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRoutines')])
  .handler(async (): Promise<RoutineSummary[]> => {
    const session = await requireSession();
    const userId = session.user.id;
    const lastUsed = db
      .select({
        date: sql<string>`max(${workouts.date})::text`.as('last_date'),
        routineId: workouts.routineId,
      })
      .from(workouts)
      .where(and(eq(workouts.userId, userId), eq(workouts.kind, 'session')))
      .groupBy(workouts.routineId)
      .as('last_used');
    const routines = await db
      .select({
        description: workouts.notes,
        id: workouts.id,
        lastUsed: lastUsed.date,
        name: workouts.name,
      })
      .from(workouts)
      .leftJoin(lastUsed, eq(lastUsed.routineId, workouts.id))
      .where(and(eq(workouts.userId, userId), eq(workouts.kind, 'routine')))
      .orderBy(sql`${lastUsed.date} DESC NULLS LAST`, desc(workouts.createdAt));
    if (routines.length === 0) return [];

    const slots = await db
      .select({ name: exercises.name, workoutId: workoutExercises.workoutId })
      .from(workoutExercises)
      .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
      .where(
        inArray(
          workoutExercises.workoutId,
          routines.map((routine) => routine.id),
        ),
      )
      .orderBy(asc(workoutExercises.position));

    return routines.map((routine) => ({
      ...routine,
      exerciseNames: slots.filter((slot) => slot.workoutId === routine.id).map((slot) => slot.name),
    }));
  });

const saveRoutineInputType = type({ workoutId: 'string.uuid', name, 'description?': description });

/** Saves the session's exercises as a new routine and links the session to it. */
export const saveRoutineFromWorkout = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('saveRoutineFromWorkout')])
  .validator(arkTypeValidator(saveRoutineInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;
    return db.transaction(async (tx) => {
      const workout = await requireOwnedWorkout(tx, userId, data.workoutId);
      const [routine] = await tx
        .insert(workouts)
        .values({
          kind: 'routine',
          name: data.name.trim(),
          notes: data.description?.trim() ?? '',
          userId,
        })
        .returning({ id: workouts.id });
      if (!routine) throw new Error('Routine insert returned no row.');
      await copyWorkoutStructure(tx, workout.id, routine.id);
      await tx.update(workouts).set({ routineId: routine.id }).where(eq(workouts.id, workout.id));
      return { id: routine.id };
    });
  });

const workoutIdInputType = type({ workoutId: 'string.uuid' });

/** Overwrites the linked routine's exercises with this session's. */
export const updateRoutineFromWorkout = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateRoutineFromWorkout')])
  .validator(arkTypeValidator(workoutIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;
    await db.transaction(async (tx) => {
      const workout = await requireOwnedWorkout(tx, userId, data.workoutId);
      const [linked] = await tx
        .select({ routineId: workouts.routineId })
        .from(workouts)
        .where(eq(workouts.id, workout.id));
      if (!linked?.routineId) throw new ClientSafeError('This workout has no routine.');
      const routine = await requireOwnedRoutine(tx, userId, linked.routineId);
      await tx.delete(workoutExercises).where(eq(workoutExercises.workoutId, routine.id));
      await copyWorkoutStructure(tx, workout.id, routine.id);
      await tx.update(workouts).set({ updatedAt: new Date() }).where(eq(workouts.id, routine.id));
    });
  });

const startRoutineInputType = type({ routineId: 'string.uuid', date: dateOnlyType });

/** Starts a session for the given day with the routine's exercises and empty sets. */
export const startRoutine = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('startRoutine')])
  .validator(arkTypeValidator(startRoutineInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;
    return db.transaction(async (tx) => {
      const routine = await requireOwnedRoutine(tx, userId, data.routineId);
      const [workout] = await tx
        .insert(workouts)
        .values({
          date: data.date,
          kind: 'session',
          name: routine.name,
          routineId: routine.id,
          startedAt: new Date(),
          userId,
        })
        .returning({ id: workouts.id });
      if (!workout) throw new Error('Workout insert returned no row.');
      await copyWorkoutStructure(tx, routine.id, workout.id);
      return { id: workout.id };
    });
  });

const updateRoutineInputType = type({
  id: 'string.uuid',
  'name?': name,
  'description?': description,
});

export const updateRoutine = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateRoutine')])
  .validator(arkTypeValidator(updateRoutineInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db.transaction(async (tx) => {
      await requireOwnedRoutine(tx, session.user.id, data.id);
      await tx
        .update(workouts)
        .set({
          ...(data.name?.trim() ? { name: data.name.trim() } : {}),
          ...(data.description === undefined ? {} : { notes: data.description.trim() }),
          updatedAt: new Date(),
        })
        .where(eq(workouts.id, data.id));
    });
  });

const idInputType = type({ id: 'string.uuid' });

/** Deletes the routine only; sessions started from it keep their sets and lose the link. */
export const deleteRoutine = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteRoutine')])
  .validator(arkTypeValidator(idInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db.transaction(async (tx) => {
      await requireOwnedRoutine(tx, session.user.id, data.id);
      await tx.delete(workouts).where(eq(workouts.id, data.id));
    });
  });
