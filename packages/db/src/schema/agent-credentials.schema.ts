import { check, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './auth.schema.ts';

/** Separate credentials keep agent access revocable without granting a browser session. */
export const agentCredentials = pgTable(
  'agent_credential',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    scope: text('scope').notNull().default('read'),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('agent_credential_user_id_idx').on(table.userId),
    check('agent_credential_read_scope_check', sql`${table.scope} = 'read'`),
  ],
);
