import { type } from 'arktype';
import { exerciseMeasures } from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import { MAX_WEIGHT_KG } from './metrics';

const name = '0 < string <= 200';
const description = 'string <= 2000';
const metric = 'number >= 0 | null';
const setType = "'normal' | 'warmup' | 'drop' | 'failure'";
const measure = type.enumerated(...exerciseMeasures);
/** Creates the exercise (or reuses one with the same name) when no id is given. */
const exerciseRef = { 'exerciseId?': 'string.uuid', 'newExercise?': { name, measure } } as const;
const setValues = {
  'weightKg?': `(0 <= number <= ${MAX_WEIGHT_KG}) | null`,
  'reps?': '(number.integer >= 0) | null',
  'durationSeconds?': metric,
  'distanceKm?': metric,
} as const;

export const workoutIdType = type({ id: 'string.uuid' });

export const startWorkoutInputType = type({ date: dateOnlyType });

export const updateWorkoutInputType = type({
  id: 'string.uuid',
  'date?': dateOnlyType,
  'name?': name,
  'finished?': 'boolean',
});

export const addWorkoutExerciseInputType = type({
  workoutId: 'string.uuid',
  ...exerciseRef,
});

export const updateWorkoutExerciseInputType = type({ id: 'string.uuid', notes: description });

export const moveWorkoutExerciseInputType = type({
  id: 'string.uuid',
  direction: "'up' | 'down'",
});

export const addWorkoutSetInputType = type({ sessionExerciseId: 'string.uuid' });

export const updateWorkoutSetInputType = type({
  id: 'string.uuid',
  'type?': setType,
  ...setValues,
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
  'measure?': measure,
  'restSeconds?': '(number.integer >= 0) | null',
});

/** Most sets a prescription can hold; matches how many empty rows a new slot can get. */
export const MAX_NEXT_SETS = 20;

/**
 * Sets prefilled the next time the exercise is added to a workout, in order. `sets` is required so
 * clearing is an explicit `null`, never a forgotten field.
 */
export const setNextSetsInputType = type({
  exerciseId: 'string.uuid',
  sets: type({ 'type?': setType, ...setValues })
    .array()
    .atLeastLength(1)
    .atMostLength(MAX_NEXT_SETS)
    .or('null'),
});

/** A whole session at once; given exercises replace the session's exercises and sets. */
export const saveWorkoutInputType = type({
  'id?': 'string.uuid',
  'date?': dateOnlyType,
  'name?': name,
  'routineId?': 'string.uuid | null',
  'finished?': 'boolean',
  'exercises?': type({
    ...exerciseRef,
    'notes?': description,
    sets: type({ 'type?': setType, ...setValues, 'done?': 'boolean' })
      .array()
      .atMostLength(30),
  })
    .array()
    .atMostLength(40),
});

/** A whole routine at once; given exercises replace the routine's exercises. */
export const saveRoutinePlanInputType = type({
  'id?': 'string.uuid',
  'name?': name,
  'description?': description,
  'exercises?': type({
    ...exerciseRef,
    setTypes: type(setType).array().atLeastLength(1).atMostLength(30),
  })
    .array()
    .atMostLength(40),
});
