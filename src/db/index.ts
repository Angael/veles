import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getServerEnv } from '@/lib/env/server';
import * as schema from './schema';

const globalForDb = globalThis as typeof globalThis & {
  __velesPool?: Pool;
};

function getPool() {
  if (!globalForDb.__velesPool) {
    globalForDb.__velesPool = new Pool({
      connectionString: getServerEnv().databaseUrl,
    });
  }

  return globalForDb.__velesPool;
}

export const db = drizzle(getPool(), { schema });
