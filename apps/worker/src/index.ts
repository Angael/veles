import { createDatabaseConnection } from '@veles/db';
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

const uploadCleanupJob = startJob({
  name: 'upload cleanup',
  intervalMs: 6 * 60 * 60 * 1000,
  run: uploadCleanup.run,
});
console.info('worker started');

/** Waits for the in-flight cleanup run before closing the clients it uses. */
async function shutdown(signal: NodeJS.Signals) {
  console.info('worker stopping', { signal });
  await uploadCleanupJob.stop();
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
