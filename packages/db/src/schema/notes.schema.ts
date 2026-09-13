import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema.ts';

export const notes = pgTable(
  'note',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    type: text('type').notNull(),
    title: text('title').notNull(),
    content: text('content'),
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

export const noteMembers = pgTable(
  'note_member',
  {
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.noteId, table.userId] }),
    index('note_member_user_id_idx').on(table.userId),
    check('note_member_role_check', sql`${table.role} IN ('owner', 'editor', 'viewer')`),
  ],
);

export const shoppingListItems = pgTable(
  'shopping_list_item',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    noteId: uuid('note_id')
      .notNull()
      .references(() => notes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    quantity: text('quantity'),
    unit: text('unit'),
    checked: boolean('checked').notNull().default(false),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('shopping_list_item_note_id_idx').on(table.noteId),
    check('shopping_list_item_position_non_negative_check', sql`${table.position} >= 0`),
  ],
);
