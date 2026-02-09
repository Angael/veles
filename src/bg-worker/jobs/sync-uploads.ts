import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { env } from '../../../env.ts';
import { db } from '../../db/index.ts';
import { fileUploads } from '../../db/schema.ts';
import { logger as baseLogger } from '../../lib/logger.ts';
import { r2Client } from '../../lib/r2/client.ts';

const logger = baseLogger.child({}, { msgPrefix: '[sync-uploads] ' });

/**
 * Sync job: lists R2 files and queries DB for PENDING uploads
 * This is a placeholder that demonstrates the worker pattern
 */
export async function syncUploads() {
	try {
		// 1. List files in R2
		const listCommand = new ListObjectsV2Command({
			Bucket: env.R2_BUCKET_NAME,
			MaxKeys: 100, // Limit for this demo
		});

		const r2Response = await r2Client.send(listCommand);
		const r2Keys = r2Response.Contents?.map((obj) => obj.Key).filter(
			Boolean,
		) as string[];

		logger.debug({ count: r2Keys.length }, 'Found files in R2');

		// 2. Query DB for PENDING uploads
		const pendingUploads = await db.query.fileUploads.findMany({
			where: eq(fileUploads.status, 'PENDING'),
		});

		logger.debug({ count: pendingUploads.length }, 'Found PENDING uploads in DB');

		// 3. Log results (future: implement sync logic here)
		for (const upload of pendingUploads) {
			const existsInR2 = r2Keys.includes(upload.r2Key);
			logger.debug(
				{
					uploadId: upload.id,
					r2Key: upload.r2Key,
					existsInR2,
				},
				existsInR2 ? 'Upload exists in R2' : 'Upload missing in R2',
			);
		}

		logger.info('Completed');
	} catch (error) {
		logger.error({ err: error }, 'Failed');
		throw error;
	}
}
