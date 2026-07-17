import { sql } from 'drizzle-orm';
import { date, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.schema';

export const diaryEntries = pgTable(
  'diary_entry',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    markdown: text('markdown').notNull(),
    entryDate: date('entry_date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('diary_entry_user_id_entry_date_idx').on(table.userId, table.entryDate)],
);
