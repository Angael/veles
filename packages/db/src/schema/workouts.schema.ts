import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
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
export const workoutExercises = pgTable(
  'workout_exercise',
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
    uniqueIndex('workout_exercise_user_id_name_idx').on(table.userId, sql`lower(${table.name})`),
    check(
      'workout_exercise_measure_check',
      sql`${table.measure} IN ('weight_reps', 'reps', 'duration', 'weight_duration', 'distance_duration')`,
    ),
  ],
);

/**
 * Reusable, user-named plan. Starting it copies its exercises and set types into a new session,
 * so editing the routine later never rewrites history.
 */
export const workoutRoutines = pgTable(
  'workout_routine',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('workout_routine_user_id_idx').on(table.userId)],
);

/**
 * An exercise slot inside a routine. Routines keep no target values: last session's numbers are
 * the goal, so only the set count and types are stored.
 */
export const workoutRoutineExercises = pgTable(
  'workout_routine_exercise',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    routineId: uuid('routine_id')
      .notNull()
      .references(() => workoutRoutines.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    /** One entry per set, in order. */
    setTypes: text('set_types', { enum: workoutSetTypes }).array().notNull(),
  },
  (table) => [
    uniqueIndex('workout_routine_exercise_routine_position_idx').on(
      table.routineId,
      table.position,
    ),
    index('workout_routine_exercise_exercise_id_idx').on(table.exerciseId),
    check(
      'workout_routine_exercise_set_types_check',
      sql`cardinality(${table.setTypes}) >= 1 AND ${table.setTypes} <@ ARRAY['normal', 'warmup', 'drop', 'failure']::text[]`,
    ),
  ],
);

/** What happened on a date: a logged or in-progress workout. */
export const workoutSessions = pgTable(
  'workout_session',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** Routine this session started from or was saved as; offers "Update routine". */
    routineId: uuid('routine_id').references(() => workoutRoutines.id, { onDelete: 'set null' }),
    /** Session day, like `food_log.log_date`. */
    date: date('date', { mode: 'string' }).notNull(),
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
    index('workout_session_user_id_date_idx').on(table.userId, table.date),
    index('workout_session_routine_id_idx').on(table.routineId),
    /** At most one open session per user; the server also checks before starting or reopening. */
    uniqueIndex('workout_session_one_open_idx')
      .on(table.userId)
      .where(sql`${table.endedAt} IS NULL`),
  ],
);

/** An exercise slot inside a session. */
export const workoutSessionExercises = pgTable(
  'workout_session_exercise',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSessions.id, { onDelete: 'cascade' }),
    /**
     * Cascade so deleting a user works (restrict blocks the user → exercise cascade). The app
     * archives exercises instead of deleting them, so history is never removed from under a session.
     */
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    /** Per session, per exercise. The last session's note is the next session's placeholder. */
    notes: text('notes').notNull().default(''),
  },
  (table) => [
    uniqueIndex('workout_session_exercise_session_position_idx').on(
      table.sessionId,
      table.position,
    ),
    index('workout_session_exercise_exercise_id_idx').on(table.exerciseId),
  ],
);

/**
 * One logged set. Every metric is nullable so any exercise can mix kinds (a timed hold after
 * weighted reps). `completedAt` marks a done set.
 */
export const workoutSets = pgTable(
  'workout_set',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    sessionExerciseId: uuid('session_exercise_id')
      .notNull()
      .references(() => workoutSessionExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    type: text('type', { enum: workoutSetTypes }).notNull().default('normal'),
    weightGrams: integer('weight_grams'),
    reps: integer('reps'),
    durationSeconds: integer('duration_seconds'),
    distanceMeters: integer('distance_meters'),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    uniqueIndex('workout_set_session_exercise_position_idx').on(
      table.sessionExerciseId,
      table.position,
    ),
    check('workout_set_type_check', sql`${table.type} IN ('normal', 'warmup', 'drop', 'failure')`),
    check(
      'workout_set_non_negative_check',
      sql`coalesce(${table.weightGrams}, 0) >= 0 AND coalesce(${table.reps}, 0) >= 0 AND coalesce(${table.durationSeconds}, 0) >= 0 AND coalesce(${table.distanceMeters}, 0) >= 0`,
    ),
  ],
);
