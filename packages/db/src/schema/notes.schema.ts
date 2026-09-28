import { sql } from 'drizzle-orm';
import { boolean, check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.schema.ts';

export const notes = pgTable(
  'note',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    type: text('type').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    shared: boolean('shared').notNull().default(false),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('note_owner_id_idx').on(table.ownerId),
    check('note_type_check', sql`${table.type} IN ('note', 'shopping_list')`),
  ],
);

export const listItems = pgTable(
  'list_item',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    checked: boolean('checked').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('list_item_note_id_idx').on(table.noteId)],
);
