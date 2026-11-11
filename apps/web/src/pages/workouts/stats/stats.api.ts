import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { autoFinishIdleWorkouts } from '../workouts.server';
import { computeWorkoutStats } from './stats.server';

export const statsPeriodType = type("'all' | 1970 <= number.integer <= 9999");

/** Replay-style training highlights for one year or all time. */
export const getWorkoutStats = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWorkoutStats')])
  .validator(arkTypeValidator(type({ period: statsPeriodType })))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await autoFinishIdleWorkouts(db, session.user.id);
    return computeWorkoutStats(session.user.id, data.period);
  });
