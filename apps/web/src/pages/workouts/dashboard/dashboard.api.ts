import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, eq, gte, isNotNull, max } from 'drizzle-orm';
import { exercises, workoutExercises, workouts, workoutSets } from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { describeSet, type Measure, type SetMetrics } from '../metrics';
import { toMetrics } from '../workouts.server';

/** One training day; `workoutId` is that day's first workout, opened on tap. */
export type CalendarDay = {
  date: string;
  seconds: number;
  workoutCount: number;
  workoutId: string;
};

export type ExerciseProgress = {
  id: string;
  name: string;
  measure: Measure;
  lastDate: string;
  /** Best set of the last session, e.g. `80 × 5`. */
  lastBest: string;
  /** The tracked number per session, oldest first; at most 12. */
  points: { date: string; value: number }[];
  unit: string;
};

const sinceInputType = type({ since: dateOnlyType });

/**
 * Training time per day since the given date. An unfinished session counts until its last ticked
 * set, so a forgotten Finish does not light up the calendar.
 */
export const getWorkoutCalendar = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWorkoutCalendar')])
  .validator(arkTypeValidator(sinceInputType))
  .handler(async ({ data }): Promise<CalendarDay[]> => {
    const session = await requireSession();
    const rows = await db
      .select({
        date: workouts.date,
        endedAt: workouts.endedAt,
        id: workouts.id,
        lastSetAt: max(workoutSets.completedAt),
        startedAt: workouts.startedAt,
      })
      .from(workouts)
      .leftJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
      .leftJoin(workoutSets, eq(workoutSets.workoutExerciseId, workoutExercises.id))
      .where(
        and(
          eq(workouts.userId, session.user.id),
          eq(workouts.kind, 'session'),
          gte(workouts.date, data.since),
        ),
      )
      .groupBy(workouts.id)
      .orderBy(asc(workouts.id));

    const byDate = new Map<string, CalendarDay>();
    for (const row of rows) {
      if (!row.date) continue;
      const start = row.startedAt?.getTime();
      const end = (row.endedAt ?? row.lastSetAt)?.getTime();
      const seconds = start && end && end > start ? (end - start) / 1000 : 0;
      const day = byDate.get(row.date);
      byDate.set(row.date, {
        date: row.date,
        seconds: Math.round((day?.seconds ?? 0) + seconds),
        workoutCount: (day?.workoutCount ?? 0) + 1,
        workoutId: day?.workoutId ?? row.id,
      });
    }
    return [...byDate.values()];
  });

/** The number that shows progress for each tracking mode, with its unit. */
function progressValue(measure: Measure, set: SetMetrics): [number | null, string] {
  switch (measure) {
    case 'weight_reps':
      return set.weightKg ? [set.weightKg, 'kg'] : [set.reps, 'reps'];
    case 'weight_duration':
      return [set.weightKg, 'kg'];
    case 'reps':
      return [set.reps, 'reps'];
    case 'duration':
      return [set.durationSeconds, 's'];
    case 'distance_duration':
      return [set.distanceKm, 'km'];
  }
}

/** Per exercise: the best set last time and the best value of each recent session. */
export const getExerciseProgress = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getExerciseProgress')])
  .handler(async (): Promise<ExerciseProgress[]> => {
    const session = await requireSession();
    const rows = await db
      .select({
        date: workouts.date,
        distanceMeters: workoutSets.distanceMeters,
        durationSeconds: workoutSets.durationSeconds,
        exerciseId: exercises.id,
        measure: exercises.measure,
        name: exercises.name,
        reps: workoutSets.reps,
        slotId: workoutExercises.id,
        weightGrams: workoutSets.weightGrams,
      })
      .from(workoutSets)
      .innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
      .where(
        and(
          eq(workouts.userId, session.user.id),
          eq(workouts.kind, 'session'),
          isNotNull(workoutSets.completedAt),
        ),
      )
      .orderBy(asc(workouts.date), asc(workouts.id));

    const byExercise = new Map<
      string,
      {
        name: string;
        measure: Measure;
        sessions: Map<string, { date: string; sets: SetMetrics[] }>;
      }
    >();
    for (const row of rows) {
      if (!row.date) continue;
      const exercise = byExercise.get(row.exerciseId) ?? {
        measure: row.measure,
        name: row.name,
        sessions: new Map<string, { date: string; sets: SetMetrics[] }>(),
      };
      const slot = exercise.sessions.get(row.slotId) ?? { date: row.date, sets: [] };
      slot.sets.push(toMetrics(row));
      exercise.sessions.set(row.slotId, slot);
      byExercise.set(row.exerciseId, exercise);
    }

    return [...byExercise].flatMap(([id, exercise]) => {
      let unit = '';
      const sessions = [...exercise.sessions.values()].slice(-12).map((slot) => {
        const scored = slot.sets.map((set) => {
          const [value, valueUnit] = progressValue(exercise.measure, set);
          unit ||= valueUnit;
          return { set, value: value ?? 0 };
        });
        const best = scored.reduce((top, item) =>
          item.value > top.value ||
          (item.value === top.value && (item.set.reps ?? 0) > (top.set.reps ?? 0))
            ? item
            : top,
        );
        return { best, date: slot.date };
      });
      const last = sessions.at(-1);
      if (!last) return [];
      return {
        id,
        lastBest: describeSet(last.best.set),
        lastDate: last.date,
        measure: exercise.measure,
        name: exercise.name,
        points: sessions.map((item) => ({ date: item.date, value: item.best.value })),
        unit,
      };
    });
  });
