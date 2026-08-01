import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

export const uploadObjects = pgTable(
  'upload_object',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    bucket: text('bucket').notNull(),
    key: text('key').notNull().unique(),
    mimeType: text('mime_type'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('upload_object_user_id_idx').on(table.userId)],
);

export const uploadObjectDeletionJobs = pgTable(
  'upload_object_deletion_job',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    bucket: text('bucket').notNull(),
    key: text('key').notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('upload_object_deletion_job_bucket_key_idx').on(table.bucket, table.key),
    index('upload_object_deletion_job_next_attempt_at_idx').on(table.nextAttemptAt),
  ],
);
