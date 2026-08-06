import { sql } from 'drizzle-orm';
import { date, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.schema.ts';

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
