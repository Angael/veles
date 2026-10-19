import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  workoutExercises,
  workoutRoutineExercises,
  workoutRoutines,
  workoutSessions,
} from '@veles/db/schema';
import type { Measure, SetType } from '../metrics';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import {
  routineWorkoutIdInputType,
  saveRoutineInputType,
  startRoutineInputType,
  updateRoutineInputType,
  workoutIdType,
} from '../workouts.validation';
import {
  deleteRoutineRecord,
  saveRoutineFromWorkoutRecord,
  startRoutineRecord,
  updateRoutineFromWorkoutRecord,
  updateRoutineRecord,
} from './routines.server';

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

/** One routine for its page: exercises in order with their set types, and when it was last done. */
export const getRoutine = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getRoutine')])
  .validator(arkTypeValidator(workoutIdType))
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

/** Saves the session's exercises as a new routine and links the session to it. */
export const saveRoutineFromWorkout = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('saveRoutineFromWorkout')])
  .validator(arkTypeValidator(saveRoutineInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return saveRoutineFromWorkoutRecord(session.user.id, data);
  });

/** Overwrites the linked routine's exercises with this session's. */
export const updateRoutineFromWorkout = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateRoutineFromWorkout')])
  .validator(arkTypeValidator(routineWorkoutIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await updateRoutineFromWorkoutRecord(session.user.id, data);
  });

/** Starts a session for the given day with the routine's exercises and empty sets. */
export const startRoutine = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('startRoutine')])
  .validator(arkTypeValidator(startRoutineInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return startRoutineRecord(session.user.id, data);
  });

export const updateRoutine = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateRoutine')])
  .validator(arkTypeValidator(updateRoutineInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await updateRoutineRecord(session.user.id, data);
  });

/** Deletes the routine only; sessions started from it keep their sets and lose the link. */
export const deleteRoutine = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteRoutine')])
  .validator(arkTypeValidator(workoutIdType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await deleteRoutineRecord(session.user.id, data);
  });
