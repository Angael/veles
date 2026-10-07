import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, inArray, isNotNull, isNull, ne, sql } from 'drizzle-orm';
import {
  exerciseMeasures,
  exercises,
  workoutExercises,
  workouts,
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
        id: exercises.id,
        lastDate: sql<string | null>`max(${workouts.date})::text`,
        measure: exercises.measure,
        name: exercises.name,
        uses: sql<number>`count(${workoutExercises.id})::int`,
      })
      .from(exercises)
      .leftJoin(workoutExercises, eq(workoutExercises.exerciseId, exercises.id))
      .leftJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .where(and(eq(exercises.userId, session.user.id), isNull(exercises.archivedAt)))
      .groupBy(exercises.id)
      .orderBy(asc(exercises.name));
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
        .select({ id: exercises.id })
        .from(exercises)
        .where(
          and(
            eq(exercises.userId, userId),
            ne(exercises.id, data.id),
            sql`lower(${exercises.name}) = lower(${name})`,
          ),
        );
      if (clash) throw new ClientSafeError(`You already have an exercise called “${name}”.`);
    }
    await db
      .update(exercises)
      .set({
        ...(name ? { name } : {}),
        ...(data.measure === undefined ? {} : { measure: data.measure }),
        ...(data.restSeconds === undefined ? {} : { restSeconds: data.restSeconds }),
        updatedAt: new Date(),
      })
      .where(eq(exercises.id, data.id));
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
        date: workouts.date,
        id: workoutExercises.id,
        notes: workoutExercises.notes,
        position: workoutExercises.position,
        workoutId: workouts.id,
        workoutName: workouts.name,
      })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .where(
        and(
          eq(workouts.userId, session.user.id),
          eq(workouts.kind, 'session'),
          eq(workoutExercises.exerciseId, data.exerciseId),
          data.excludeWorkoutId ? ne(workouts.id, data.excludeWorkoutId) : undefined,
        ),
      )
      .orderBy(desc(workouts.date), desc(workouts.id))
      .limit(20);
    if (entries.length === 0) return [];

    const [siblings, sets] = await Promise.all([
      db
        .select({ position: workoutExercises.position, workoutId: workoutExercises.workoutId })
        .from(workoutExercises)
        .where(
          inArray(
            workoutExercises.workoutId,
            entries.map((entry) => entry.workoutId),
          ),
        ),
      db
        .select()
        .from(workoutSets)
        .where(
          and(
            inArray(
              workoutSets.workoutExerciseId,
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
        date: entry.date ?? '',
        exerciseCount: positions.length,
        id: entry.id,
        note: entry.notes,
        position: positions.filter((slot) => slot.position <= entry.position).length,
        sets: sets
          .filter((set) => set.workoutExerciseId === entry.id)
          .map((set) => describeSet(toMetrics(set))),
        workoutName: entry.workoutName,
      };
    });
  });
