import { S3Client } from '@aws-sdk/client-s3';
import { createDatabaseConnection } from '@veles/db';
import { syncFoodProductSeeds } from '@veles/db/seed/sync-food-products';
import { createFoodPhotoScanner } from './food-photo-scan.ts';
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
const r2Config = {
  accountId: requireEnv('R2_ACCOUNT_ID'),
  accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
  secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
};
const uploadCleanup = createUploadCleanup(connection.db, r2Config);

// Each deploy restarts the worker, so this keeps the shared food catalog in step with the seed file.
try {
  console.info('food product seeds synced', await syncFoodProductSeeds(connection.db));
} catch (error) {
  console.error('food product seed sync failed', { error: errorMessage(error) });
}

const uploadCleanupJob = startJob({
  name: 'upload cleanup',
  intervalMs: 6 * 60 * 60 * 1000,
  run: uploadCleanup.run,
});

// Photo logging is optional: without a key, scans stay queued until one is set.
const aiApiKey = process.env.AI_API_KEY;
const photoS3 = new S3Client({
  endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
  region: 'auto',
  credentials: { accessKeyId: r2Config.accessKeyId, secretAccessKey: r2Config.secretAccessKey },
});
const foodPhotoJob = aiApiKey
  ? startJob({
      name: 'food photo scan',
      intervalMs: 5000,
      run: createFoodPhotoScanner(connection.db, photoS3, {
        apiKey: aiApiKey,
        baseUrl: process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1',
        model: process.env.AI_MODEL || 'z-ai/glm-5.3-flash',
      }),
    })
  : null;
if (!foodPhotoJob) console.warn('AI_API_KEY is not set; food photo scans are not processed');
console.info('worker started');

/** Waits for the in-flight cleanup run before closing the clients it uses. */
async function shutdown(signal: NodeJS.Signals) {
  console.info('worker stopping', { signal });
  await Promise.all([uploadCleanupJob.stop(), foodPhotoJob?.stop()]);
  uploadCleanup.close();
  photoS3.destroy();
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
