import { syncUploads } from "./jobs/sync-uploads.ts";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS) || 5000;

console.log(`[bg-worker] Starting background worker (interval: ${INTERVAL_MS}ms)`);

/**
 * Main worker loop
 * Runs jobs at specified interval
 */
async function runWorker() {
	try {
		await syncUploads();
	} catch (error) {
		console.error("[bg-worker] Job failed:", error);
	}
}

// Initial run
runWorker();

// Schedule subsequent runs
setInterval(runWorker, INTERVAL_MS);

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("[bg-worker] Received SIGTERM, shutting down gracefully...");
	process.exit(0);
});

process.on("SIGINT", () => {
	console.log("[bg-worker] Received SIGINT, shutting down gracefully...");
	process.exit(0);
});
