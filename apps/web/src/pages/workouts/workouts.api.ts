import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq, sql } from 'drizzle-orm';
import { workoutSessionExercises, workoutSessions, workoutSets } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { floorDuration } from './metrics';
import { autoFinishIdleWorkouts, setSecondsSql, loadWorkoutSession } from './workouts.server';
import {
  deleteWorkoutRecord,
  startWorkoutRecord,
  updateWorkoutRecord,
} from './session/session.server';
import {
  startWorkoutInputType,
  updateWorkoutInputType,
  workoutIdType,
} from './workouts.validation';

export type WorkoutSummary = {
  id: string;
  name: string;
  date: string;
  startedAt: string | null;
  endedAt: string | null;
  /** Finished duration, floored at time entered on sets. Null while open. */
  durationSeconds: number | null;
  exerciseCount: number;
  doneSets: number;
  volumeKg: number;
};

export const getWorkouts = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWorkouts')])
  .handler(async (): Promise<WorkoutSummary[]> => {
    const session = await requireSession();
    await autoFinishIdleWorkouts(db, session.user.id);
    const done = sql`${workoutSets.completedAt} IS NOT NULL`;
    const rows = await db
      .select({
        setSeconds: setSecondsSql,
        date: workoutSessions.date,
        doneSets: sql<number>`count(${workoutSets.id}) FILTER (WHERE ${done})::int`,
        endedAt: workoutSessions.endedAt,
        exerciseCount: sql<number>`count(DISTINCT ${workoutSessionExercises.id})::int`,
        id: workoutSessions.id,
        name: workoutSessions.name,
        startedAt: workoutSessions.startedAt,
        volumeGrams: sql<number>`coalesce(sum(${workoutSets.weightGrams}::bigint * ${workoutSets.reps}) FILTER (WHERE ${done}), 0)::float8`,
      })
      .from(workoutSessions)
      .leftJoin(workoutSessionExercises, eq(workoutSessionExercises.sessionId, workoutSessions.id))
      .leftJoin(workoutSets, eq(workoutSets.sessionExerciseId, workoutSessionExercises.id))
      .where(and(eq(workoutSessions.userId, session.user.id)))
      .groupBy(workoutSessions.id)
      .orderBy(desc(workoutSessions.date), desc(workoutSessions.id))
      .limit(200);

    return rows.map((row) => ({
      date: row.date,
      doneSets: row.doneSets,
      durationSeconds: row.endedAt
        ? floorDuration(
            row.startedAt ? (row.endedAt.getTime() - row.startedAt.getTime()) / 1000 : null,
            row.setSeconds,
          )
        : null,
      endedAt: row.endedAt?.toISOString() ?? null,
      exerciseCount: row.exerciseCount,
      id: row.id,
      name: row.name,
      startedAt: row.startedAt?.toISOString() ?? null,
      volumeKg: Math.round(row.volumeGrams / 1_000),
    }));
  });

export const getWorkoutSession = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWorkoutSession')])
  .validator(arkTypeValidator(workoutIdType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await autoFinishIdleWorkouts(db, session.user.id);
    return loadWorkoutSession(session.user.id, data.id);
  });

/** Creates an empty session for the given local day, named after the weekday. */
export const startWorkout = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('startWorkout')])
  .validator(arkTypeValidator(startWorkoutInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return startWorkoutRecord(session.user.id, data);
  });

/** Renames a session, moves it to another day, or finishes / reopens it. */
export const updateWorkout = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateWorkout')])
  .validator(arkTypeValidator(updateWorkoutInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await updateWorkoutRecord(session.user.id, data);
  });

export const deleteWorkout = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteWorkout')])
  .validator(arkTypeValidator(workoutIdType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await deleteWorkoutRecord(session.user.id, data);
  });
