import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
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
