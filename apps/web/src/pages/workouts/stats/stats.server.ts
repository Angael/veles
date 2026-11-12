import { addDays, addWeeks, format, getISODay, parseISO, startOfISOWeek } from 'date-fns';
import { and, eq, gte, lte, min, sql } from 'drizzle-orm';
import {
  workoutExercises,
  workoutRoutines,
  workoutSessionExercises,
  workoutSessions,
  workoutSets,
} from '@veles/db/schema';
import { getLocale } from '@/lib/i18n/getLocale';
import { db } from '@/server/db.server';
import { floorDuration } from '../metrics';
import { workoutName } from '../workoutName';
import { exerciseNamesBySession, setSecondsSql } from '../workouts.server';

/** A calendar year, or every workout ever logged. */
export type StatsPeriod = number | 'all';

/** How many favourite exercises the replay ranks. */
const TOP_EXERCISES = 5;

export type ExerciseStat = {
  id: string;
  name: string;
  /** Sessions with at least one done set of this exercise. */
  sessions: number;
  /** Share of all sessions in the period, 0–1. */
  share: number;
  firstDate: string;
  lastDate: string;
};

export type SessionRef = { id: string; name: string; date: string };

export type Streak = { length: number; from: string; to: string };

export type WorkoutStats = {
  period: StatsPeriod;
  /** Years with at least one workout, newest first, for the period picker. */
  years: number[];
  sessions: number;
  activeDays: number;
  totalSeconds: number;
  /** Different exercises with a done set in the period. */
  exercises: number;
  /** Exercises done for the first time ever in the period. */
  newExercises: number;
  topExercises: ExerciseStat[];
  /** Sessions per ISO weekday, Monday first. */
  weekdays: number[];
  /** Sessions per month (`YYYY-MM`) for a year, or per year (`YYYY`) for all time. */
  timeline: { key: string; sessions: number }[];
  /** Start times of sessions; the browser buckets them by its own time zone. */
  startedAt: string[];
  weekStreak: Streak | null;
  dayStreak: Streak | null;
  favouriteRoutine: { id: string; name: string; sessions: number } | null;
  longestSession: (SessionRef & { seconds: number }) | null;
  firstSession: SessionRef | null;
};

const shortDate = (date: Date) => format(date, 'yyyy-MM-dd');

/**
 * Longest run of consecutive steps (days or ISO weeks). `keys` are sorted, unique `YYYY-MM-DD`
 * starts of each step; `next` returns the step after a key.
 */
function longestRun(keys: string[], next: (date: Date) => Date): Streak | null {
  let best: Streak | null = null;
  let from = '';
  let to = '';
  let length = 0;
  for (const key of keys) {
    const continues = length > 0 && shortDate(next(parseISO(to))) === key;
    from = continues ? from : key;
    length = continues ? length + 1 : 1;
    to = key;
    if (!best || length > best.length) best = { from, length, to };
  }
  return best;
}

/** Most frequent value and its count; ties keep the first seen. */
function mostCommon<T>(values: T[]) {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best: { value: T; count: number } | null = null;
  for (const [value, count] of counts) if (!best || count > best.count) best = { count, value };
  return best;
}

function timelineKeys(period: StatsPeriod, years: number[]) {
  if (period !== 'all') {
    return Array.from(
      { length: 12 },
      (_, month) => `${period}-${String(month + 1).padStart(2, '0')}`,
    );
  }
  const oldest = years.at(-1);
  const newest = years.at(0);
  if (oldest === undefined || newest === undefined) return [];
  return Array.from({ length: newest - oldest + 1 }, (_, index) => String(oldest + index));
}

/**
 * Replay-style training summary for a year or all time: how often, when, and what the user
 * trained. Counts sessions and days rather than lifted volume. Sessions count an exercise only
 * when it has a done set, so skipped routine slots do not inflate favourites.
 */
export async function computeWorkoutStats(
  userId: string,
  period: StatsPeriod,
): Promise<WorkoutStats> {
  const inPeriod = and(
    eq(workoutSessions.userId, userId),
    period === 'all' ? undefined : gte(workoutSessions.date, `${period}-01-01`),
    period === 'all' ? undefined : lte(workoutSessions.date, `${period}-12-31`),
  );
  const doneSlot = sql`EXISTS (SELECT 1 FROM ${workoutSets} WHERE ${workoutSets.sessionExerciseId} = ${workoutSessionExercises.id} AND ${workoutSets.completedAt} IS NOT NULL)`;

  const [sessions, slots, firstDone, yearRows] = await Promise.all([
    db
      .select({
        date: workoutSessions.date,
        durationSeconds: workoutSessions.durationSeconds,
        endedAt: workoutSessions.endedAt,
        id: workoutSessions.id,
        name: workoutSessions.name,
        routineId: workoutRoutines.id,
        routineName: workoutRoutines.name,
        setSeconds: setSecondsSql,
        startedAt: workoutSessions.startedAt,
      })
      .from(workoutSessions)
      .leftJoin(
        workoutRoutines,
        and(eq(workoutRoutines.id, workoutSessions.routineId), eq(workoutRoutines.userId, userId)),
      )
      .leftJoin(workoutSessionExercises, eq(workoutSessionExercises.sessionId, workoutSessions.id))
      .leftJoin(workoutSets, eq(workoutSets.sessionExerciseId, workoutSessionExercises.id))
      .where(inPeriod)
      .groupBy(workoutSessions.id, workoutRoutines.id)
      .orderBy(workoutSessions.date, workoutSessions.id),
    db
      .selectDistinct({
        date: workoutSessions.date,
        exerciseId: workoutExercises.id,
        name: workoutExercises.name,
        sessionId: workoutSessions.id,
      })
      .from(workoutSessionExercises)
      .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
      .innerJoin(workoutExercises, eq(workoutExercises.id, workoutSessionExercises.exerciseId))
      .where(and(inPeriod, doneSlot)),
    db
      .select({ exerciseId: workoutSessionExercises.exerciseId, first: min(workoutSessions.date) })
      .from(workoutSessionExercises)
      .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
      .where(and(eq(workoutSessions.userId, userId), doneSlot))
      .groupBy(workoutSessionExercises.exerciseId),
    db
      .selectDistinct({ year: sql<number>`extract(year from ${workoutSessions.date})::int` })
      .from(workoutSessions)
      .where(eq(workoutSessions.userId, userId)),
  ]);
  const years = yearRows.map((row) => row.year).toSorted((a, b) => b - a);

  const withSeconds = sessions.map((session) => ({
    ...session,
    seconds:
      session.durationSeconds ??
      (session.endedAt
        ? floorDuration(
            session.startedAt
              ? (session.endedAt.getTime() - session.startedAt.getTime()) / 1000
              : null,
            session.setSeconds,
          )
        : null),
  }));

  const byExercise = Map.groupBy(slots, (slot) => slot.exerciseId);
  const topExercises = [...byExercise.values()]
    .map((rows) => {
      const dates = rows.map((row) => row.date).toSorted();
      const count = new Set(rows.map((row) => row.sessionId)).size;
      return {
        firstDate: dates[0] ?? '',
        id: rows[0]?.exerciseId ?? '',
        lastDate: dates.at(-1) ?? '',
        name: rows[0]?.name ?? '',
        sessions: count,
        share: sessions.length ? count / sessions.length : 0,
      };
    })
    .toSorted((a, b) => b.sessions - a.sessions || a.firstDate.localeCompare(b.firstDate))
    .slice(0, TOP_EXERCISES);

  const newExercises = firstDone.filter(
    (row) => row.first && (period === 'all' || row.first.startsWith(`${period}-`)),
  ).length;

  const weekdays = Array.from(
    { length: 7 },
    (_, index) =>
      sessions.filter((session) => getISODay(parseISO(session.date)) === index + 1).length,
  );

  const timeline = timelineKeys(period, years).map((key) => ({
    key,
    sessions: sessions.filter((session) => session.date.startsWith(key)).length,
  }));

  const days = [...new Set(sessions.map((session) => session.date))];
  const weeks = [...new Set(days.map((day) => shortDate(startOfISOWeek(parseISO(day)))))];

  const routine = mostCommon(
    sessions.flatMap((session) =>
      session.routineId && session.routineName ? [session.routineId] : [],
    ),
  );
  const routineName = sessions.find((session) => session.routineId === routine?.value)?.routineName;

  const longest = withSeconds.reduce<(typeof withSeconds)[number] | null>(
    (best, session) => ((session.seconds ?? 0) > (best?.seconds ?? 0) ? session : best),
    null,
  );
  const first = sessions[0] ?? null;
  const names = await exerciseNamesBySession(
    [longest?.id, first?.id].filter((id): id is string => Boolean(id)),
  );
  const locale = getLocale();
  const ref = (session: { id: string; name: string; date: string }): SessionRef => ({
    date: session.date,
    id: session.id,
    name: workoutName(session, names.get(session.id) ?? [], locale),
  });

  return {
    activeDays: days.length,
    dayStreak: longestRun(days, (date) => addDays(date, 1)),
    exercises: byExercise.size,
    favouriteRoutine:
      routine && routineName
        ? { id: routine.value, name: routineName, sessions: routine.count }
        : null,
    firstSession: first ? ref(first) : null,
    longestSession: longest?.seconds ? { ...ref(longest), seconds: longest.seconds } : null,
    newExercises,
    period,
    sessions: sessions.length,
    startedAt: sessions.flatMap((session) =>
      session.startedAt ? [session.startedAt.toISOString()] : [],
    ),
    timeline,
    topExercises,
    totalSeconds: withSeconds.reduce((sum, session) => sum + (session.seconds ?? 0), 0),
    weekStreak: longestRun(weeks, (date) => addWeeks(date, 1)),
    weekdays,
    years,
  };
}
