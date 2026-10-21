import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@veles/db/schema';

/**
 * An in-memory PostgreSQL (PGlite) with the tables that note and diary writes touch, so tests can
 * check real SQL such as version checks. Tests swap it in with `vi.mock('@/server/db.server')`.
 */
export async function createTestDatabase() {
  const client = new PGlite();
  await client.exec(`
    CREATE TABLE "user" (id text PRIMARY KEY, name text NOT NULL);
    CREATE TABLE user_connection (
      user_low_id text NOT NULL REFERENCES "user"(id),
      user_high_id text NOT NULL REFERENCES "user"(id)
    );
    CREATE TABLE note (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL,
      title text NOT NULL,
      content text NOT NULL DEFAULT '',
      shared boolean NOT NULL DEFAULT false,
      version integer NOT NULL DEFAULT 1,
      owner_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE list_item (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      note_id uuid NOT NULL REFERENCES note(id) ON DELETE CASCADE,
      name text NOT NULL,
      checked boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE diary_entry (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      ciphertext text,
      entry_date date NOT NULL,
      version integer NOT NULL DEFAULT 1,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );
    INSERT INTO "user" (id, name) VALUES ('owner', 'Owner'), ('stranger', 'Stranger');
  `);

  return {
    db: drizzle(client, { schema }),
    /** Empties the note and diary tables between tests; the two users stay. */
    reset: () => client.exec('TRUNCATE note, list_item, diary_entry'),
  };
}
