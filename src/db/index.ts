import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from 'env.ts';
import { Pool } from 'pg';
import * as schema from './schema.ts';

const pool = new Pool({
	connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
