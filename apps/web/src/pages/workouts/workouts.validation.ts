import { type } from 'arktype';
import { exerciseMeasures } from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import { MAX_WEIGHT_KG } from './metrics';

const name = '0 < string <= 200';
const description = 'string <= 2000';
const metric = 'number >= 0 | null';

export const workoutIdType = type({ id: 'string.uuid' });

export const startWorkoutInputType = type({ date: dateOnlyType });

export const updateWorkoutInputType = type({
  id: 'string.uuid',
  'name?': name,
  'finished?': 'boolean',
});

export const addWorkoutExerciseInputType = type({
  workoutId: 'string.uuid',
  'exerciseId?': 'string.uuid',
  /** Creates the exercise (or reuses one with the same name) when no id is given. */
  'newExercise?': {
    name,
    measure: type.enumerated(...exerciseMeasures),
  },
});

export const updateWorkoutExerciseInputType = type({ id: 'string.uuid', notes: description });

export const moveWorkoutExerciseInputType = type({
  id: 'string.uuid',
  direction: "'up' | 'down'",
});

export const addWorkoutSetInputType = type({ sessionExerciseId: 'string.uuid' });

export const updateWorkoutSetInputType = type({
  id: 'string.uuid',
  'type?': "'normal' | 'warmup' | 'drop' | 'failure'",
  'weightKg?': `(0 <= number <= ${MAX_WEIGHT_KG}) | null`,
  'reps?': '(number.integer >= 0) | null',
  'durationSeconds?': metric,
  'distanceKm?': metric,
  'done?': 'boolean',
});

export const saveRoutineInputType = type({
  workoutId: 'string.uuid',
  name,
  'description?': description,
});

export const routineWorkoutIdInputType = type({ workoutId: 'string.uuid' });

export const startRoutineInputType = type({ routineId: 'string.uuid', date: dateOnlyType });

export const updateRoutineInputType = type({
  id: 'string.uuid',
  'name?': name,
  'description?': description,
});

export const updateExerciseInputType = type({
  id: 'string.uuid',
  'name?': name,
  'measure?': type.enumerated(...exerciseMeasures),
  'restSeconds?': '(number.integer >= 0) | null',
});
