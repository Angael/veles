// DRAFT for the workouts playground (#177). Not exported from `index.ts` yet, so drizzle-kit
// ignores it. Export it and generate a migration only after the shape is picked.
import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema.ts';

/**
 * Which inputs a set row shows. Sets keep every metric column nullable, so changing this later
 * never loses logged data; it only changes which fields the UI offers.
 */
export const exerciseMeasures = [
  'weight_reps',
  'reps',
  'duration',
  'weight_duration',
  'distance_duration',
] as const;

export const workoutSetTypes = ['normal', 'warmup', 'drop', 'failure'] as const;

/** User-named exercise. There is no shared catalog: "Bench (the flat one)" is a valid name. */
export const exercises = pgTable(
  'exercise',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    measure: text('measure', { enum: exerciseMeasures }).notNull().default('weight_reps'),
    /** Rest timer after a completed set; null turns the timer off for this exercise. */
    restSeconds: integer('rest_seconds').default(120),
    notes: text('notes').notNull().default(''),
    /** Hidden from the picker but kept so old sessions still resolve their exercise. */
    archivedAt: timestamp('archived_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('exercise_user_id_name_idx').on(table.userId, sql`lower(${table.name})`),
    check(
      'exercise_measure_check',
      sql`${table.measure} IN ('weight_reps', 'reps', 'duration', 'weight_duration', 'distance_duration')`,
    ),
  ],
);

/**
 * One table for routines and logged sessions. A routine is a reusable, user-named plan; a session
 * is what happened on a date. Starting a routine copies its exercises and sets into a new session,
 * so editing the routine later never rewrites history.
 */
export const workouts = pgTable(
  'workout',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['routine', 'session'] }).notNull(),
    name: text('name').notNull(),
    notes: text('notes').notNull().default(''),
    /** Routine this session started from; drives the "previous" column. */
    routineId: uuid('routine_id').references((): AnyPgColumn => workouts.id, {
      onDelete: 'set null',
    }),
    /** Session day, like `food_log.log_date`; null for routines. */
    date: date('date', { mode: 'string' }),
    startedAt: timestamp('started_at'),
    /** Null while the session is in progress. */
    endedAt: timestamp('ended_at'),
    /**
     * Manual length for sessions logged without sets (e.g. "Football, 90 min"); otherwise the
     * UI derives it from startedAt/endedAt.
     */
    durationSeconds: integer('duration_seconds'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('workout_user_id_kind_date_idx').on(table.userId, table.kind, table.date),
    index('workout_routine_id_idx').on(table.routineId),
    check('workout_kind_check', sql`${table.kind} IN ('routine', 'session')`),
    check('workout_session_date_check', sql`(${table.kind} = 'routine') = (${table.date} IS NULL)`),
  ],
);

/** An exercise slot inside a routine or session. */
export const workoutExercises = pgTable(
  'workout_exercise',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    workoutId: uuid('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    /** Restrict: archive exercises instead of deleting them out from under history. */
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    /** Adjacent slots sharing a number form a superset. */
    supersetGroup: smallint('superset_group'),
    /** Overrides `exercise.rest_seconds` for this slot only. */
    restSeconds: integer('rest_seconds'),
    notes: text('notes').notNull().default(''),
  },
  (table) => [
    uniqueIndex('workout_exercise_workout_position_idx').on(table.workoutId, table.position),
    index('workout_exercise_exercise_id_idx').on(table.exerciseId),
  ],
);

/**
 * One set. Every metric is nullable so any exercise can mix kinds (a timed hold after weighted
 * reps). In a routine these are targets; in a session `completedAt` marks a done set.
 */
export const workoutSets = pgTable(
  'workout_set',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    workoutExerciseId: uuid('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    type: text('type', { enum: workoutSetTypes }).notNull().default('normal'),
    /** Negative means assistance, e.g. an assisted pull-up at -20 kg. */
    weightGrams: integer('weight_grams'),
    reps: integer('reps'),
    durationSeconds: integer('duration_seconds'),
    distanceMeters: integer('distance_meters'),
    /** RPE × 10, so 8.5 is stored as 85. */
    rpeTenths: smallint('rpe_tenths'),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    uniqueIndex('workout_set_exercise_position_idx').on(table.workoutExerciseId, table.position),
    check('workout_set_type_check', sql`${table.type} IN ('normal', 'warmup', 'drop', 'failure')`),
    check(
      'workout_set_non_negative_check',
      sql`coalesce(${table.reps}, 0) >= 0 AND coalesce(${table.durationSeconds}, 0) >= 0 AND coalesce(${table.distanceMeters}, 0) >= 0`,
    ),
    check(
      'workout_set_rpe_check',
      sql`${table.rpeTenths} IS NULL OR ${table.rpeTenths} BETWEEN 10 AND 100`,
    ),
  ],
);
