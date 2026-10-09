import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { format, parseISO } from 'date-fns';
import { and, desc, eq, sql } from 'drizzle-orm';
import { workoutSessionExercises, workoutSessions, workoutSets } from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import {
  autoFinishIdleWorkouts,
  loadWorkoutSession,
  requireNoOpenWorkout,
  requireOwnedWorkout,
} from './workouts.server';

export type WorkoutSummary = {
  id: string;
  name: string;
  date: string;
  startedAt: string | null;
  endedAt: string | null;
  exerciseCount: number;
  doneSets: number;
  volumeKg: number;
};

const idInputType = type({ id: 'string.uuid' });

export const getWorkouts = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWorkouts')])
  .handler(async (): Promise<WorkoutSummary[]> => {
    const session = await requireSession();
    await autoFinishIdleWorkouts(db, session.user.id);
    const done = sql`${workoutSets.completedAt} IS NOT NULL`;
    const rows = await db
      .select({
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
  .validator(arkTypeValidator(idInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await autoFinishIdleWorkouts(db, session.user.id);
    return loadWorkoutSession(session.user.id, data.id);
  });

const startWorkoutInputType = type({ date: dateOnlyType });

/** Creates an empty session for the given local day, named after the weekday. */
export const startWorkout = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('startWorkout')])
  .validator(arkTypeValidator(startWorkoutInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await autoFinishIdleWorkouts(db, session.user.id);
    await requireNoOpenWorkout(db, session.user.id);
    const [workout] = await db
      .insert(workoutSessions)
      .values({
        date: data.date,
        name: `${format(parseISO(data.date), 'EEEE')} workout`,
        startedAt: new Date(),
        userId: session.user.id,
      })
      .returning({ id: workoutSessions.id });
    if (!workout) throw new Error('Workout insert returned no row.');
    return { id: workout.id };
  });

const updateWorkoutInputType = type({
  id: 'string.uuid',
  'name?': '0 < string <= 200',
  'finished?': 'boolean',
});

/** Renames a session, or finishes / reopens it. Reopening is refused while another is open. */
export const updateWorkout = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateWorkout')])
  .validator(arkTypeValidator(updateWorkoutInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await requireOwnedWorkout(db, session.user.id, data.id);
    if (data.finished === false) {
      await autoFinishIdleWorkouts(db, session.user.id);
      await requireNoOpenWorkout(db, session.user.id, data.id);
    }
    await db
      .update(workoutSessions)
      .set({
        ...(data.name?.trim() ? { name: data.name.trim() } : {}),
        ...(data.finished === undefined ? {} : { endedAt: data.finished ? new Date() : null }),
        updatedAt: new Date(),
      })
      .where(eq(workoutSessions.id, data.id));
  });

export const deleteWorkout = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteWorkout')])
  .validator(arkTypeValidator(idInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await requireOwnedWorkout(db, session.user.id, data.id);
    await db.delete(workoutSessions).where(eq(workoutSessions.id, data.id));
  });
