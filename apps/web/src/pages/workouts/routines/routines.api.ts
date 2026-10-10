import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  workoutExercises,
  workoutRoutineExercises,
  workoutRoutines,
  workoutSessions,
} from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import type { Measure, SetType } from '../metrics';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import {
  autoFinishIdleWorkouts,
  requireNoOpenWorkout,
  requireOwnedWorkout,
} from '../workouts.server';
import { copyRoutineToSession, copySessionToRoutine, requireOwnedRoutine } from './routines.server';

export type RoutineSummary = {
  id: string;
  name: string;
  description: string;
  exerciseNames: string[];
  lastUsed: string | null;
};

export type RoutineDetail = {
  id: string;
  name: string;
  description: string;
  lastUsed: string | null;
  exercises: { id: string; name: string; measure: Measure; setTypes: SetType[] }[];
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
        date: sql<string>`max(${workoutSessions.date})::text`.as('last_date'),
        routineId: workoutSessions.routineId,
      })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId))
      .groupBy(workoutSessions.routineId)
      .as('last_used');
    const routines = await db
      .select({
        description: workoutRoutines.description,
        id: workoutRoutines.id,
        lastUsed: lastUsed.date,
        name: workoutRoutines.name,
      })
      .from(workoutRoutines)
      .leftJoin(lastUsed, eq(lastUsed.routineId, workoutRoutines.id))
      .where(eq(workoutRoutines.userId, userId))
      .orderBy(sql`${lastUsed.date} DESC NULLS LAST`, desc(workoutRoutines.createdAt));
    if (routines.length === 0) return [];

    const slots = await db
      .select({ name: workoutExercises.name, routineId: workoutRoutineExercises.routineId })
      .from(workoutRoutineExercises)
      .innerJoin(workoutExercises, eq(workoutExercises.id, workoutRoutineExercises.exerciseId))
      .where(
        inArray(
          workoutRoutineExercises.routineId,
          routines.map((routine) => routine.id),
        ),
      )
      .orderBy(asc(workoutRoutineExercises.position));

    return routines.map((routine) => ({
      ...routine,
      exerciseNames: slots.filter((slot) => slot.routineId === routine.id).map((slot) => slot.name),
    }));
  });

const routineIdInputType = type({ id: 'string.uuid' });

/** One routine for its page: exercises in order with their set types, and when it was last done. */
export const getRoutine = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRoutine')])
  .validator(arkTypeValidator(routineIdInputType))
  .handler(async ({ data }): Promise<RoutineDetail> => {
    const session = await requireSession();
    const userId = session.user.id;
    const [routine] = await db
      .select({
        description: workoutRoutines.description,
        id: workoutRoutines.id,
        name: workoutRoutines.name,
      })
      .from(workoutRoutines)
      .where(and(eq(workoutRoutines.id, data.id), eq(workoutRoutines.userId, userId)));
    if (!routine) throw new ClientSafeError('Routine not found.');

    const [slots, [lastUsed]] = await Promise.all([
      db
        .select({
          id: workoutRoutineExercises.id,
          measure: workoutExercises.measure,
          name: workoutExercises.name,
          setTypes: workoutRoutineExercises.setTypes,
        })
        .from(workoutRoutineExercises)
        .innerJoin(workoutExercises, eq(workoutExercises.id, workoutRoutineExercises.exerciseId))
        .where(eq(workoutRoutineExercises.routineId, routine.id))
        .orderBy(asc(workoutRoutineExercises.position)),
      db
        .select({ date: sql<string | null>`max(${workoutSessions.date})::text` })
        .from(workoutSessions)
        .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.routineId, routine.id))),
    ]);

    return { ...routine, exercises: slots, lastUsed: lastUsed?.date ?? null };
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
        .select({ routineId: workoutSessions.routineId })
        .from(workoutSessions)
        .where(eq(workoutSessions.id, workout.id));
      if (!linked?.routineId) throw new ClientSafeError('This workout has no routine.');
      const routine = await requireOwnedRoutine(tx, userId, linked.routineId);
      await tx
        .delete(workoutRoutineExercises)
        .where(eq(workoutRoutineExercises.routineId, routine.id));
      await copySessionToRoutine(tx, workout.id, routine.id);
      await tx
        .update(workoutRoutines)
        .set({ updatedAt: new Date() })
        .where(eq(workoutRoutines.id, routine.id));
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
        .update(workoutRoutines)
        .set({
          ...(data.name?.trim() ? { name: data.name.trim() } : {}),
          ...(data.description === undefined ? {} : { description: data.description.trim() }),
          updatedAt: new Date(),
        })
        .where(eq(workoutRoutines.id, data.id));
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
      await tx.delete(workoutRoutines).where(eq(workoutRoutines.id, data.id));
    });
  });
