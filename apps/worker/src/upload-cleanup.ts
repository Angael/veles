import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { createDatabaseConnection } from '@veles/db';
import { foodLogs, foodProducts, recipeImages, uploadObjects } from '@veles/db/schema';
import { and, asc, eq, gt, notExists } from 'drizzle-orm';

type Database = ReturnType<typeof createDatabaseConnection>['db'];
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
  );
}

/** Owns an R2 client and bounded cleanup batches; failures leave rows available for retry. */
export function createUploadCleanup(db: Database, isStopping: () => boolean) {
  let client: S3Client | undefined;
  let lastCandidateId: string | undefined;

  function getClient() {
    if (client) return client;
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY are required');
    }
    client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: { accessKeyId, secretAccessKey },
      maxAttempts: 1,
    });
    return client;
  }

  /** Locks before rechecking references so concurrent FK attachments cannot race R2 deletion. */
  async function deleteUnusedUpload(id: string) {
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
        if (!unused || isStopping()) return false;

        await getClient().send(new DeleteObjectCommand({ Bucket: asset.bucket, Key: asset.key }), {
          abortSignal: AbortSignal.timeout(deletionTimeoutMs),
        });
        await tx.delete(uploadObjects).where(eq(uploadObjects.id, id));
        return true;
      },
      { isolationLevel: 'read committed' },
    );
  }

  /**
   * Processes a bounded batch and isolates failures per asset and from other worker jobs.
   * Resolves `true` when the batch was full, so the caller can drain the backlog immediately.
   */
  async function run() {
    const startedAt = Date.now();
    let hasMore = false;
    let deleted = 0;
    let failed = 0;
    let skipped = 0;
    try {
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
      // Sweep past failures so one bad batch cannot starve other orphaned assets.
      // Reset once a partial batch ends the sweep, so the next sweep retries failures.
      hasMore = candidates.length === batchSize;
      lastCandidateId = hasMore ? candidates.at(-1)?.id : undefined;
      for (const { id } of candidates) {
        if (isStopping()) break;
        try {
          if (await deleteUnusedUpload(id)) {
            deleted++;
            console.info('unused upload deleted', { uploadObjectId: id });
          } else {
            skipped++;
          }
        } catch (error) {
          failed++;
          console.error('unused upload deletion failed', {
            uploadObjectId: id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      console.info('upload cleanup completed', {
        candidates: candidates.length,
        deleted,
        failed,
        skipped,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      console.error('upload cleanup failed', {
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return hasMore && !isStopping();
  }

  return { run, close: () => client?.destroy() };
}
