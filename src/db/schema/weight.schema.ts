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
import { users } from './auth.schema';
import { uploadObjects } from './uploads.schema';

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

export const progressPhotos = pgTable(
  'progress_photo',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    weightEntryId: uuid('weight_entry_id')
      .notNull()
      .references(() => weightEntries.id, { onDelete: 'cascade' }),
    uploadObjectId: text('upload_object_id')
      .notNull()
      .unique()
      .references(() => uploadObjects.id, { onDelete: 'restrict' }),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('progress_photo_weight_entry_id_idx').on(table.weightEntryId),
    check('progress_photo_width_check', sql`${table.width} > 0`),
    check('progress_photo_height_check', sql`${table.height} > 0`),
  ],
);
