import { and, eq, lt } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { fileUploads } from '../../db/schema.ts';
import { logger as baseLogger } from '../../lib/logger.ts';

const logger = baseLogger.child(
	{},
	{ msgPrefix: '[cleanup-pending-uploads] ' },
);

/**
 * Cleanup job: removes file uploads that have been pending for more than 1 day
 * This prevents the database from accumulating stale upload records
 */
export async function cleanupPendingUploads() {
	try {
		// Calculate the timestamp for 1 day ago
		const oneDayAgo = new Date();
		oneDayAgo.setDate(oneDayAgo.getDate() - 1);

		// Find and delete pending uploads older than 1 day
		const deletedUploads = await db
			.delete(fileUploads)
			.where(
				and(
					eq(fileUploads.status, 'PENDING'),
					lt(fileUploads.createdAt, oneDayAgo),
				),
			)
			.returning({ id: fileUploads.id, r2Key: fileUploads.r2Key });

		if (deletedUploads.length > 0) {
			logger.info(
				{
					count: deletedUploads.length,
					uploads: deletedUploads.map((u) => u.r2Key),
				},
				'Deleted stale uploads',
			);
		} else {
			logger.debug('No stale uploads found');
		}
	} catch (error) {
		logger.error({ err: error }, 'Failed');
		throw error;
	}
}
