import { createDatabaseConnection } from '@veles/db';
import { sql } from 'drizzle-orm';
import { errorMessage, startJob } from './job.ts';
import { createUploadCleanup } from './upload-cleanup.ts';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const connection = createDatabaseConnection({
  connectionString: requireEnv('DATABASE_URL'),
  maxConnections: 5,
});
const uploadCleanup = createUploadCleanup(connection.db, {
  accountId: requireEnv('R2_ACCOUNT_ID'),
  accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
  secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
});

const jobs = [
  startJob({
    name: 'database check',
    intervalMs: 10_000,
    run: async () => {
      await connection.db.execute(sql`select 1`);
    },
  }),
  startJob({
    name: 'upload cleanup',
    intervalMs: 6 * 60 * 60 * 1000,
    run: uploadCleanup.run,
  }),
];
console.info('worker started');

/** Waits for in-flight job runs before closing the clients they use. */
async function shutdown(signal: NodeJS.Signals) {
  console.info('worker stopping', { signal });
  await Promise.all(jobs.map((job) => job.stop()));
  uploadCleanup.close();
  await connection.close();
}

let stopping: Promise<void> | undefined;

function requestShutdown(signal: NodeJS.Signals) {
  stopping ??= shutdown(signal).catch((error: unknown) => {
    console.error('worker shutdown failed', { error: errorMessage(error) });
    process.exitCode = 1;
  });
}

process.once('SIGINT', () => requestShutdown('SIGINT'));
process.once('SIGTERM', () => requestShutdown('SIGTERM'));
