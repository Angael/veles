import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import {
  autoFinishIdleWorkouts,
  listWorkoutSummaries,
  loadWorkoutSession,
  type WorkoutSummary,
} from './workouts.server';
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

export const getWorkouts = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWorkouts')])
  .handler(async (): Promise<WorkoutSummary[]> => {
    const session = await requireSession();
    await autoFinishIdleWorkouts(db, session.user.id);
    return listWorkoutSummaries(session.user.id);
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
