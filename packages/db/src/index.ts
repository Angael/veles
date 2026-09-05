import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.ts';

type DatabaseConnectionOptions = {
  connectionString: string;
  maxConnections?: number;
};

/** Creates one explicitly owned Drizzle client and its underlying PostgreSQL pool. */
export function createDatabaseConnection({
  connectionString,
  maxConnections = 5,
}: DatabaseConnectionOptions) {
  const pool = new Pool({
    connectionString,
    max: maxConnections,
  });

  return {
    db: drizzle(pool, { schema }),
    close: () => pool.end(),
  };
}
