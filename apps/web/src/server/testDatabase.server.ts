import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@veles/db/schema';

const migrationsFolder = fileURLToPath(new URL('../../../../packages/db/drizzle', import.meta.url));

export type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>;

/**
 * An in-memory PostgreSQL (PGlite) built from the real Drizzle migrations, so tests can check real
 * SQL such as version checks. Tests swap it in with `vi.mock('@/server/db.server')`.
 */
export async function createTestDatabase() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder });
  await client.exec(`
    INSERT INTO "user" (id, name, email)
    VALUES ('owner', 'Owner', 'owner@test'), ('stranger', 'Stranger', 'stranger@test');
  `);

  return {
    db,
    /** Empties the note and diary tables between tests; the two users stay. */
    reset: () => client.exec('TRUNCATE note, list_item, diary_entry'),
  };
}
