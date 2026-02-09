import { logger as baseLogger } from '../lib/logger.ts';
import { cleanupPendingUploads } from './jobs/cleanup-pending-uploads.ts';
import { syncUploads } from './jobs/sync-uploads.ts';

const logger = baseLogger.child({}, { msgPrefix: '[bg-worker] ' });

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS) || 10000;

logger.info({ intervalMs: INTERVAL_MS }, 'Starting');

/**
 * Main worker loop
 * Runs jobs sequentially, then schedules next run after completion
 */
async function runWorker() {
	try {
		await syncUploads();
		await cleanupPendingUploads();
	} catch (error) {
		logger.error({ err: error }, 'Job failed');
	}

	// Schedule next run after current run completes
	setTimeout(runWorker, INTERVAL_MS);
}

// Start the worker loop
runWorker();

// Graceful shutdown
process.on('SIGTERM', () => {
	logger.info('Shutting down gracefully (SIGTERM)');
	process.exit(0);
});

process.on('SIGINT', () => {
	logger.info('Shutting down gracefully (SIGINT)');
	process.exit(0);
});
