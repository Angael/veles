import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, eq, gte, max } from 'drizzle-orm';
import { workoutSessionExercises, workoutSessions, workoutSets } from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { autoFinishIdleWorkouts } from '../workouts.server';

/** One training day; `workoutId` is that day's first workout, opened on tap. */
export type CalendarDay = {
  date: string;
  seconds: number;
  workoutCount: number;
  workoutId: string;
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
    await autoFinishIdleWorkouts(db, session.user.id);
    const rows = await db
      .select({
        date: workoutSessions.date,
        endedAt: workoutSessions.endedAt,
        id: workoutSessions.id,
        lastSetAt: max(workoutSets.completedAt),
        startedAt: workoutSessions.startedAt,
      })
      .from(workoutSessions)
      .leftJoin(workoutSessionExercises, eq(workoutSessionExercises.sessionId, workoutSessions.id))
      .leftJoin(workoutSets, eq(workoutSets.sessionExerciseId, workoutSessionExercises.id))
      .where(
        and(eq(workoutSessions.userId, session.user.id), gte(workoutSessions.date, data.since)),
      )
      .groupBy(workoutSessions.id)
      .orderBy(asc(workoutSessions.id));

    const byDate = new Map<string, CalendarDay>();
    for (const row of rows) {
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
