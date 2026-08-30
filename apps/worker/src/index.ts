import { createDatabaseConnection } from '@veles/db';
import { sql } from 'drizzle-orm';

const checkIntervalMs = 10_000;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const connection = createDatabaseConnection({
  connectionString: databaseUrl,
  maxConnections: 5,
});

let isStopping = false;
let nextCheck: NodeJS.Timeout | undefined;

/** Verifies that the worker can reach PostgreSQL without overlapping checks. */
async function checkDatabase() {
  const startedAt = Date.now();

  try {
    await connection.db.execute(sql`select 1`);
    console.info('database check succeeded', { durationMs: Date.now() - startedAt });
  } catch (error) {
    console.error('database check failed', {
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  if (!isStopping) {
    nextCheck = setTimeout(() => {
      void checkDatabase();
    }, checkIntervalMs);
  }
}

/** Stops new checks and lets the shared PostgreSQL pool close cleanly. */
async function shutdown(signal: NodeJS.Signals) {
  if (isStopping) return;

  isStopping = true;
  if (nextCheck) clearTimeout(nextCheck);
  console.info('worker stopping', { signal });
  await connection.close();
}

function reportShutdownFailure(error: unknown) {
  console.error('worker shutdown failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exitCode = 1;
}

function requestShutdown(signal: NodeJS.Signals) {
  void shutdown(signal).catch(reportShutdownFailure);
}

process.once('SIGINT', () => requestShutdown('SIGINT'));
process.once('SIGTERM', () => requestShutdown('SIGTERM'));

console.info('worker started', { checkIntervalMs });
await checkDatabase();
