import { createDatabaseConnection } from '@veles/db';
import { foodLogs, foodProducts, recipeImages, uploadObjects } from '@veles/db/schema';
import { and, count, eq, notExists, sql } from 'drizzle-orm';

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

/** Counts upload rows that no current feature references. */
async function countUnusedUploads() {
  const [result] = await connection.db
    .select({ count: count() })
    .from(uploadObjects)
    .where(
      and(
        notExists(
          connection.db
            .select({ id: foodProducts.id })
            .from(foodProducts)
            .where(eq(foodProducts.imageUploadObjectId, uploadObjects.id)),
        ),
        notExists(
          connection.db
            .select({ id: foodLogs.id })
            .from(foodLogs)
            .where(eq(foodLogs.imageUploadObjectId, uploadObjects.id)),
        ),
        notExists(
          connection.db
            .select({ id: recipeImages.id })
            .from(recipeImages)
            .where(eq(recipeImages.uploadObjectId, uploadObjects.id)),
        ),
      ),
    );

  return result?.count ?? 0;
}
/** Verifies that the worker can reach PostgreSQL without overlapping checks. */
async function checkDatabase() {
  const startedAt = Date.now();

  try {
    await connection.db.execute(sql`select 1`);
    const unusedUploads = await countUnusedUploads();
    // TODO: Unused uploads should be deleted later.
    console.info('database check succeeded', {
      durationMs: Date.now() - startedAt,
      unusedUploads,
    });
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
