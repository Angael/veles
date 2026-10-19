import { and, asc, countDistinct, desc, eq, inArray, max } from 'drizzle-orm';
import {
  workoutExercises,
  workoutRoutineExercises,
  workoutRoutines,
  workoutSessionExercises,
  workoutSessions,
  workoutSets,
} from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { sessionsBefore, toMetrics } from '@/pages/workouts/workouts.server';
import { db } from '@/server/db.server';
import { byIdDesc, inDateRange, parseKey, type ReadQuery, toPage } from './mcp-read.server';

/** Session cursors are `<date>_<id>` because several sessions can share a date. */
function parseSessionCursor(cursor: string) {
  const [date, id] = cursor.split('_');
  if (!date || !id) throw new ClientSafeError('Invalid cursor.');
  return { date: parseKey(date, 'date'), id: parseKey(id, 'uuid') };
}

/** Exercise slots and their sets for owned sessions, already grouped per session. */
async function loadSessionExercises(userId: string, sessionIds: string[]) {
  if (!sessionIds.length) return new Map<string, never[]>();
  const owned = and(
    eq(workoutSessions.userId, userId),
    inArray(workoutSessionExercises.sessionId, sessionIds),
  );
  const [slots, sets] = await Promise.all([
    db
      .select({
        id: workoutSessionExercises.id,
        sessionId: workoutSessionExercises.sessionId,
        exerciseId: workoutSessionExercises.exerciseId,
        name: workoutExercises.name,
        measure: workoutExercises.measure,
        notes: workoutSessionExercises.notes,
      })
      .from(workoutSessionExercises)
      .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
      .innerJoin(workoutExercises, eq(workoutExercises.id, workoutSessionExercises.exerciseId))
      .where(owned)
      .orderBy(asc(workoutSessionExercises.position)),
    db
      .select({ set: workoutSets })
      .from(workoutSets)
      .innerJoin(
        workoutSessionExercises,
        eq(workoutSessionExercises.id, workoutSets.sessionExerciseId),
      )
      .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
      .where(owned)
      .orderBy(asc(workoutSets.position)),
  ]);
  const setsBySlot = Map.groupBy(
    sets.map(({ set }) => set),
    (set) => set.sessionExerciseId,
  );
  const exercises = slots.map(({ sessionId, ...slot }) => ({
    sessionId,
    exercise: {
      ...slot,
      sets: (setsBySlot.get(slot.id) ?? []).map((set) => ({
        id: set.id,
        type: set.type,
        done: set.completedAt !== null,
        ...toMetrics(set),
      })),
    },
  }));
  return Map.groupBy(exercises, (entry) => entry.sessionId);
}

/** Owned workout sessions, newest first, each with its exercises and sets nested. */
export async function readWorkoutSessions(userId: string, query: ReadQuery) {
  const rows = await db
    .select({
      id: workoutSessions.id,
      name: workoutSessions.name,
      date: workoutSessions.date,
      startedAt: workoutSessions.startedAt,
      endedAt: workoutSessions.endedAt,
      durationSeconds: workoutSessions.durationSeconds,
      routineId: workoutRoutines.id,
      routineName: workoutRoutines.name,
    })
    .from(workoutSessions)
    .leftJoin(
      workoutRoutines,
      and(eq(workoutRoutines.id, workoutSessions.routineId), eq(workoutRoutines.userId, userId)),
    )
    .where(
      and(
        eq(workoutSessions.userId, userId),
        query.id ? eq(workoutSessions.id, parseKey(query.id, 'uuid')) : undefined,
        query.cursor ? sessionsBefore(userId, parseSessionCursor(query.cursor)) : undefined,
        inDateRange(workoutSessions.date, query),
      ),
    )
    .orderBy(desc(workoutSessions.date), desc(workoutSessions.id))
    .limit(query.limit + 1);
  const page = toPage(rows, query.limit, (session) => `${session.date}_${session.id}`);
  const exercisesBySession = await loadSessionExercises(
    userId,
    page.items.map((session) => session.id),
  );

  return {
    nextCursor: page.nextCursor,
    items: page.items.map(({ routineId, routineName, durationSeconds, ...session }) => ({
      ...session,
      inProgress: session.endedAt === null,
      durationSeconds:
        durationSeconds ??
        (session.startedAt && session.endedAt
          ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000)
          : null),
      routine: routineId && routineName ? { id: routineId, name: routineName } : null,
      exercises: (exercisesBySession.get(session.id) ?? []).map((entry) => entry.exercise),
    })),
  };
}

/** Owned routines, newest first, each with its ordered exercises and planned set types. */
export async function readWorkoutRoutines(userId: string, query: ReadQuery) {
  const rows = await db
    .select({
      id: workoutRoutines.id,
      name: workoutRoutines.name,
      description: workoutRoutines.description,
    })
    .from(workoutRoutines)
    .where(and(eq(workoutRoutines.userId, userId), byIdDesc(workoutRoutines.id, query)))
    .orderBy(desc(workoutRoutines.id))
    .limit(query.limit + 1);
  const page = toPage(rows, query.limit, (routine) => routine.id);
  const routineIds = page.items.map((routine) => routine.id);
  const slots = routineIds.length
    ? await db
        .select({
          routineId: workoutRoutineExercises.routineId,
          name: workoutExercises.name,
          measure: workoutExercises.measure,
          restSeconds: workoutExercises.restSeconds,
          setTypes: workoutRoutineExercises.setTypes,
        })
        .from(workoutRoutineExercises)
        .innerJoin(workoutRoutines, eq(workoutRoutines.id, workoutRoutineExercises.routineId))
        .innerJoin(workoutExercises, eq(workoutExercises.id, workoutRoutineExercises.exerciseId))
        .where(
          and(
            eq(workoutRoutines.userId, userId),
            inArray(workoutRoutineExercises.routineId, routineIds),
          ),
        )
        .orderBy(asc(workoutRoutineExercises.position))
    : [];
  const slotsByRoutine = Map.groupBy(slots, (slot) => slot.routineId);

  return {
    nextCursor: page.nextCursor,
    items: page.items.map((routine) => ({
      ...routine,
      exercises: (slotsByRoutine.get(routine.id) ?? []).map(
        ({ routineId: _routineId, ...slot }) => slot,
      ),
    })),
  };
}

/** Owned exercises, newest first, with when and how often each was done. */
export async function readWorkoutExercises(userId: string, query: ReadQuery) {
  const rows = await db
    .select({
      id: workoutExercises.id,
      name: workoutExercises.name,
      measure: workoutExercises.measure,
      restSeconds: workoutExercises.restSeconds,
      notes: workoutExercises.notes,
      archivedAt: workoutExercises.archivedAt,
    })
    .from(workoutExercises)
    .where(and(eq(workoutExercises.userId, userId), byIdDesc(workoutExercises.id, query)))
    .orderBy(desc(workoutExercises.id))
    .limit(query.limit + 1);
  const page = toPage(rows, query.limit, (exercise) => exercise.id);
  const exerciseIds = page.items.map((exercise) => exercise.id);
  const usage = exerciseIds.length
    ? await db
        .select({
          exerciseId: workoutSessionExercises.exerciseId,
          lastDoneOn: max(workoutSessions.date),
          sessionCount: countDistinct(workoutSessions.id),
        })
        .from(workoutSessionExercises)
        .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSessionExercises.sessionId))
        .where(
          and(
            eq(workoutSessions.userId, userId),
            inArray(workoutSessionExercises.exerciseId, exerciseIds),
          ),
        )
        .groupBy(workoutSessionExercises.exerciseId)
    : [];
  const usageByExercise = new Map(usage.map((row) => [row.exerciseId, row]));

  return {
    nextCursor: page.nextCursor,
    items: page.items.map(({ archivedAt, ...exercise }) => ({
      ...exercise,
      archived: archivedAt !== null,
      lastDoneOn: usageByExercise.get(exercise.id)?.lastDoneOn ?? null,
      sessionCount: usageByExercise.get(exercise.id)?.sessionCount ?? 0,
    })),
  };
}
