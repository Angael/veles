import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { createDatabaseConnection } from '@veles/db';
import {
  foodLogs,
  foodProducts,
  recipeImages,
  uploadObjects,
  weightEntryPhotos,
} from '@veles/db/schema';
import { and, asc, eq, gt, notExists } from 'drizzle-orm';
import { errorMessage } from './job.ts';

type Database = ReturnType<typeof createDatabaseConnection>['db'];

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
};

const batchSize = 50;
const deletionTimeoutMs = 10_000;

/** Checks every supported reference, including historical food log snapshots. */
function unusedUploadCondition(db: Pick<Database, 'select'>) {
  return and(
    notExists(
      db
        .select({ id: foodProducts.id })
        .from(foodProducts)
        .where(eq(foodProducts.imageUploadObjectId, uploadObjects.id)),
    ),
    notExists(
      db
        .select({ id: foodLogs.id })
        .from(foodLogs)
        .where(eq(foodLogs.imageUploadObjectId, uploadObjects.id)),
    ),
    notExists(
      db
        .select({ id: recipeImages.id })
        .from(recipeImages)
        .where(eq(recipeImages.uploadObjectId, uploadObjects.id)),
    ),
    notExists(
      db
        .select({ id: weightEntryPhotos.id })
        .from(weightEntryPhotos)
        .where(eq(weightEntryPhotos.uploadObjectId, uploadObjects.id)),
    ),
  );
}

/** Deletes unreferenced upload objects from R2, then their database rows. */
export function createUploadCleanup(db: Database, r2: R2Config) {
  const client = new S3Client({
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    region: 'auto',
    credentials: { accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey },
    maxAttempts: 1,
  });
  // Sweep cursor: skips past failed IDs so they cannot starve the rest of the backlog.
  let lastCandidateId: string | undefined;

  /** Locks before rechecking references so concurrent FK attachments cannot race R2 deletion. */
  async function deleteUnusedUpload(id: string, signal: AbortSignal) {
    return db.transaction(
      async (tx) => {
        const [asset] = await tx
          .select()
          .from(uploadObjects)
          .where(eq(uploadObjects.id, id))
          .for('update', { skipLocked: true });
        if (!asset) return false;

        // Use a fresh READ COMMITTED statement after acquiring the lock: a reference
        // may have committed between candidate selection and locking the upload row.
        const [unused] = await tx
          .select({ id: uploadObjects.id })
          .from(uploadObjects)
          .where(and(eq(uploadObjects.id, id), unusedUploadCondition(tx)));
        if (!unused || signal.aborted) return false;

        await client.send(new DeleteObjectCommand({ Bucket: asset.bucket, Key: asset.key }), {
          abortSignal: AbortSignal.any([signal, AbortSignal.timeout(deletionTimeoutMs)]),
        });
        await tx.delete(uploadObjects).where(eq(uploadObjects.id, id));
        return true;
      },
      { isolationLevel: 'read committed' },
    );
  }

  /** Processes one batch, isolating failures per asset. Returns whether the batch was full. */
  async function runBatch(signal: AbortSignal) {
    const startedAt = Date.now();
    const candidates = await db
      .select({ id: uploadObjects.id })
      .from(uploadObjects)
      .where(
        and(
          unusedUploadCondition(db),
          lastCandidateId ? gt(uploadObjects.id, lastCandidateId) : undefined,
        ),
      )
      .orderBy(asc(uploadObjects.id))
      .limit(batchSize);
    const isFull = candidates.length === batchSize;
    // A partial batch ends the sweep; the next sweep starts over and retries failures.
    lastCandidateId = isFull ? candidates.at(-1)?.id : undefined;

    let deleted = 0;
    let failed = 0;
    let skipped = 0;
    for (const { id } of candidates) {
      if (signal.aborted) break;
      try {
        if (await deleteUnusedUpload(id, signal)) {
          deleted++;
          console.info('unused upload deleted', { uploadObjectId: id });
        } else {
          skipped++;
        }
      } catch (error) {
        failed++;
        console.error('unused upload deletion failed', {
          uploadObjectId: id,
          error: errorMessage(error),
        });
      }
    }
    console.info('upload cleanup batch completed', {
      candidates: candidates.length,
      deleted,
      failed,
      skipped,
      durationMs: Date.now() - startedAt,
    });
    return isFull;
  }

  /** Drains the backlog batch by batch until a partial batch ends the sweep. */
  async function run(signal: AbortSignal) {
    while (!signal.aborted && (await runBatch(signal))) {
      // Full batch: more orphans may remain, keep draining.
    }
  }

  return { run, close: () => client.destroy() };
}
