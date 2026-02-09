import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { fileUploads } from "../../db/schema.ts";

/**
 * Cleanup job: removes file uploads that have been pending for more than 1 day
 * This prevents the database from accumulating stale upload records
 */
export async function cleanupPendingUploads() {
	console.log("[cleanup-pending-uploads] Starting cleanup job...");

	try {
		// Calculate the timestamp for 1 day ago
		const oneDayAgo = new Date();
		oneDayAgo.setDate(oneDayAgo.getDate() - 1);

		// Find and delete pending uploads older than 1 day
		const deletedUploads = await db
			.delete(fileUploads)
			.where(
				and(
					eq(fileUploads.status, "PENDING"),
					lt(fileUploads.createdAt, oneDayAgo),
				),
			)
			.returning({ id: fileUploads.id, r2Key: fileUploads.r2Key });

		if (deletedUploads.length > 0) {
			console.log(
				`[cleanup-pending-uploads] Deleted ${deletedUploads.length} stale pending uploads:`,
			);
			for (const upload of deletedUploads) {
				console.log(
					`[cleanup-pending-uploads]   - ID ${upload.id}: ${upload.r2Key}`,
				);
			}
		} else {
			console.log(
				"[cleanup-pending-uploads] No stale pending uploads found",
			);
		}

		console.log("[cleanup-pending-uploads] Cleanup job completed");
	} catch (error) {
		console.error("[cleanup-pending-uploads] Error during cleanup:", error);
		throw error;
	}
}
