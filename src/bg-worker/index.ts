import { cleanupPendingUploads } from "./jobs/cleanup-pending-uploads.ts";
import { syncUploads } from "./jobs/sync-uploads.ts";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS) || 5000;

console.log(`[bg-worker] Starting background worker (interval: ${INTERVAL_MS}ms)`);

/**
 * Main worker loop
 * Runs jobs sequentially, then schedules next run after completion
 */
async function runWorker() {
	try {
		await syncUploads();
		await cleanupPendingUploads();
	} catch (error) {
		console.error("[bg-worker] Job failed:", error);
	}

	// Schedule next run after current run completes
	setTimeout(runWorker, INTERVAL_MS);
}

// Start the worker loop
runWorker();

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("[bg-worker] Received SIGTERM, shutting down gracefully...");
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("[bg-worker] Received SIGINT, shutting down gracefully...");
	process.exit(0);
});
