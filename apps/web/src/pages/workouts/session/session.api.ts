import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import {
  addWorkoutExerciseInputType,
  addWorkoutSetInputType,
  moveWorkoutExerciseInputType,
  updateWorkoutExerciseInputType,
  updateWorkoutSetInputType,
  workoutIdType,
} from '../workouts.validation';
import {
  addWorkoutExerciseRecord,
  addWorkoutSetRecord,
  deleteWorkoutSetRecord,
  duplicateWorkoutSetRecord,
  moveWorkoutExerciseRecord,
  removeWorkoutExerciseRecord,
  updateWorkoutExerciseRecord,
  updateWorkoutSetRecord,
} from './session.server';

export const addWorkoutExercise = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('addWorkoutExercise')])
  .validator(arkTypeValidator(addWorkoutExerciseInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return addWorkoutExerciseRecord(session.user.id, data);
  });

export const updateWorkoutExercise = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateWorkoutExercise')])
  .validator(arkTypeValidator(updateWorkoutExerciseInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await updateWorkoutExerciseRecord(session.user.id, data);
  });

export const moveWorkoutExercise = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('moveWorkoutExercise')])
  .validator(arkTypeValidator(moveWorkoutExerciseInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await moveWorkoutExerciseRecord(session.user.id, data);
  });

export const removeWorkoutExercise = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('removeWorkoutExercise')])
  .validator(arkTypeValidator(workoutIdType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await removeWorkoutExerciseRecord(session.user.id, data);
  });

export const addWorkoutSet = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('addWorkoutSet')])
  .validator(arkTypeValidator(addWorkoutSetInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return addWorkoutSetRecord(session.user.id, data);
  });

export const duplicateWorkoutSet = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('duplicateWorkoutSet')])
  .validator(arkTypeValidator(workoutIdType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    return duplicateWorkoutSetRecord(session.user.id, data);
  });

export const updateWorkoutSet = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateWorkoutSet')])
  .validator(arkTypeValidator(updateWorkoutSetInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await updateWorkoutSetRecord(session.user.id, data);
  });

export const deleteWorkoutSet = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('deleteWorkoutSet')])
  .validator(arkTypeValidator(workoutIdType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await deleteWorkoutSetRecord(session.user.id, data);
  });
