import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth.schema.ts';

export const userConnections = pgTable(
  'user_connection',
  {
    userLowId: text('user_low_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    userHighId: text('user_high_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userLowId, table.userHighId] }),
    index('user_connection_user_high_id_idx').on(table.userHighId),
    check('user_connection_canonical_order_check', sql`${table.userLowId} < ${table.userHighId}`),
  ],
);

export const connectionInvitations = pgTable(
  'connection_invitation',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    inviterUserId: text('inviter_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientEmail: text('recipient_email').notNull(),
    tokenHash: text('token_hash').notNull(),
    deliveryFailed: boolean('delivery_failed').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('connection_invitation_recipient_email_idx').on(table.recipientEmail),
    uniqueIndex('connection_invitation_inviter_recipient_idx').on(
      table.inviterUserId,
      table.recipientEmail,
    ),
    uniqueIndex('connection_invitation_token_hash_idx').on(table.tokenHash),
  ],
);
