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
import { uploadObjects } from './uploads.schema.ts';

export const weightEntries = pgTable(
  'weight_entry',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    weightGrams: integer('weight_grams').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
  },
  (table) => [uniqueIndex('weight_entry_user_id_date_idx').on(table.userId, table.date)],
);

/**
 * Owner-private progress photos for a weight entry. Objects live in the public bucket, so their
 * storage keys must be random v4 UUIDs, never derived from user/entry IDs or time-ordered UUIDv7.
 */
export const weightEntryPhotos = pgTable(
  'weight_entry_photo',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    weightEntryId: uuid('weight_entry_id')
      .notNull()
      .references(() => weightEntries.id, { onDelete: 'cascade' }),
    uploadObjectId: text('upload_object_id')
      .notNull()
      .references(() => uploadObjects.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('weight_entry_photo_weight_entry_id_idx').on(table.weightEntryId),
    uniqueIndex('weight_entry_photo_entry_position_idx').on(table.weightEntryId, table.position),
    uniqueIndex('weight_entry_photo_upload_object_id_idx').on(table.uploadObjectId),
    check('weight_entry_photo_position_non_negative_check', sql`${table.position} >= 0`),
  ],
);
