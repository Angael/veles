import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { dateOnlyType } from '@/lib/dateOnly';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { autoFinishIdleWorkouts, listWorkoutSummaries } from '../workouts.server';

const rangeInputType = type({ from: dateOnlyType, to: dateOnlyType });

/** Every workout on the local days of one calendar page. */
export const getWorkoutCalendar = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getWorkoutCalendar')])
  .validator(arkTypeValidator(rangeInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await autoFinishIdleWorkouts(db, session.user.id);
    return listWorkoutSummaries(session.user.id, data);
  });
