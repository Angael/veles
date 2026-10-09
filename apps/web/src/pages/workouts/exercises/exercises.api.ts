import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm';
import {
  exerciseMeasures,
  workoutExercises,
  workoutSessionExercises,
  workoutSessions,
  workoutSets,
} from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { describeSet, type Measure } from '../metrics';
import { requireOwnedExercise, toMetrics } from '../workouts.server';

export type ExerciseOption = {
  id: string;
  name: string;
  measure: Measure;
  uses: number;
  lastDate: string | null;
};

/** One past appearance of an exercise, for the history dialog. */
export type ExerciseHistoryEntry = {
  id: string;
  date: string;
  workoutName: string;
  /** 1-based order in that workout: "it went great because it was first". */
  position: number;
  exerciseCount: number;
  sets: string[];
  note: string;
};

/** The user's own exercises for the picker, with use counts for ranking. */
export const getExercises = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getExercises')])
  .handler(async (): Promise<ExerciseOption[]> => {
    const session = await requireSession();
    const rows = await db
      .select({
        id: workoutExercises.id,
        lastDate: sql<string | null>`max(${workoutSessions.date})::text`,
        measure: workoutExercises.measure,
        name: workoutExercises.name,
        uses: sql<number>`count(${workoutSessionExercises.id})::int`,
      })
      .from(workoutExercises)
      .leftJoin(
        workoutSessionExercises,
        eq(workoutSessionExercises.exerciseId, workoutExercises.id),
      )
      .leftJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
      .where(and(eq(workoutExercises.userId, session.user.id), isNull(workoutExercises.archivedAt)))
      .groupBy(workoutExercises.id)
      .orderBy(asc(workoutExercises.name));
    return rows;
  });

const updateExerciseInputType = type({
  id: 'string.uuid',
  'name?': '0 < string <= 200',
  'measure?': type.enumerated(...exerciseMeasures),
  'restSeconds?': '(number.integer >= 0) | null',
});

/** Rename, tracking mode and rest length belong to the exercise, so they carry to next time. */
export const updateExercise = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateExercise')])
  .validator(arkTypeValidator(updateExerciseInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const userId = session.user.id;
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
      if (clash) throw new ClientSafeError(`You already have an exercise called “${name}”.`);
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
  });

const exerciseHistoryInputType = type({
  exerciseId: 'string.uuid',
  'excludeWorkoutId?': 'string.uuid',
});

/** Last 20 sessions of one exercise with done sets, note and where it sat in that workout. */
export const getExerciseHistory = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getExerciseHistory')])
  .validator(arkTypeValidator(exerciseHistoryInputType))
  .handler(async ({ data }): Promise<ExerciseHistoryEntry[]> => {
    const session = await requireSession();
    const entries = await db
      .select({
        date: workoutSessions.date,
        id: workoutSessionExercises.id,
        notes: workoutSessionExercises.notes,
        position: workoutSessionExercises.position,
        workoutId: workoutSessions.id,
        workoutName: workoutSessions.name,
      })
      .from(workoutSessionExercises)
      .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
      .where(
        and(
          eq(workoutSessions.userId, session.user.id),
          eq(workoutSessionExercises.exerciseId, data.exerciseId),
          data.excludeWorkoutId ? ne(workoutSessions.id, data.excludeWorkoutId) : undefined,
        ),
      )
      .orderBy(desc(workoutSessions.date), desc(workoutSessions.id))
      .limit(20);
    if (entries.length === 0) return [];

    const [siblings, sets] = await Promise.all([
      db
        .select({
          position: workoutSessionExercises.position,
          workoutId: workoutSessionExercises.sessionId,
        })
        .from(workoutSessionExercises)
        .where(
          inArray(
            workoutSessionExercises.sessionId,
            entries.map((entry) => entry.workoutId),
          ),
        ),
      db
        .select()
        .from(workoutSets)
        .where(
          and(
            inArray(
              workoutSets.sessionExerciseId,
              entries.map((entry) => entry.id),
            ),
            isNotNull(workoutSets.completedAt),
          ),
        )
        .orderBy(asc(workoutSets.position)),
    ]);

    return entries.map((entry) => {
      const positions = siblings.filter((slot) => slot.workoutId === entry.workoutId);
      return {
        date: entry.date,
        exerciseCount: positions.length,
        id: entry.id,
        note: entry.notes,
        position: positions.filter((slot) => slot.position <= entry.position).length,
        sets: sets
          .filter((set) => set.sessionExerciseId === entry.id)
          .map((set) => describeSet(toMetrics(set))),
        workoutName: entry.workoutName,
      };
    });
  });
