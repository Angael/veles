import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { eq } from 'drizzle-orm';
import { env } from '../../../env.ts';
import { db } from '../../db/index.ts';
import { fileUploads } from '../../db/schema.ts';
import { r2Client } from '../../lib/r2/client.ts';

/**
 * Sync job: lists R2 files and queries DB for PENDING uploads
 * This is a placeholder that demonstrates the worker pattern
 */
export async function syncUploads() {
	console.log('[sync-uploads] Starting sync job...');

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

		console.log(`[sync-uploads] Found ${r2Keys.length} files in R2`);

		// 2. Query DB for PENDING uploads
		const pendingUploads = await db.query.fileUploads.findMany({
			where: eq(fileUploads.status, 'PENDING'),
		});

		console.log(
			`[sync-uploads] Found ${pendingUploads.length} PENDING uploads in DB`,
		);

		// 3. Log results (future: implement sync logic here)
		for (const upload of pendingUploads) {
			const existsInR2 = r2Keys.includes(upload.r2Key);
			console.log(
				`[sync-uploads] Upload ID ${upload.id}: ${upload.r2Key} - ${existsInR2 ? 'EXISTS' : 'MISSING'} in R2`,
			);
		}

		console.log('[sync-uploads] Sync job completed');
	} catch (error) {
		console.error('[sync-uploads] Error during sync:', error);
		throw error;
	}
}
