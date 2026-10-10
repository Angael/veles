import { sql } from 'drizzle-orm';
import { date, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth.schema.ts';

export const diaryEntries = pgTable(
  'diary_entry',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** Legacy plaintext; cleared when the browser encrypts the entry. Drop after migration. */
    title: text('title'),
    /** Legacy plaintext; cleared when the browser encrypts the entry. Drop after migration. */
    markdown: text('markdown'),
    /** AES-GCM sealed `{ title, markdown }`, encrypted in the browser. Null means empty entry. */
    ciphertext: text('ciphertext'),
    entryDate: date('entry_date', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('diary_entry_user_id_entry_date_idx').on(table.userId, table.entryDate)],
);

/**
 * Per-user diary data key, wrapped by a key derived from the user's passphrase in the browser.
 * The server never sees the passphrase or the unwrapped key.
 */
export const diaryKeys = pgTable('diary_key', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  /** Base64 PBKDF2 salt. */
  salt: text('salt').notNull(),
  /** PBKDF2-SHA256 iteration count used to derive the wrapping key. */
  iterations: integer('iterations').notNull(),
  /** Sealed (IV + AES-GCM wrapped) raw data key. */
  wrappedKey: text('wrapped_key').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
