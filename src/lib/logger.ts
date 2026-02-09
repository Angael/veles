import pino from "pino";

/**
 * Server-side logger using pino with pretty console output
 * Configured for development and Docker/Dokploy terminal logs
 *
 * Features:
 * - Colored output for easy reading
 * - Timestamps in HH:MM:ss format
 * - Structured logging with context
 * - Multiple log levels (debug, info, warn, error)
 *
 * Usage:
 *   logger.info('Server started');
 *   logger.info({ component: 'bg-worker' }, 'Processing job');
 *   logger.error({ err: error }, 'Failed to process');
 *
 * DO NOT use this in client/React code - use console.log there
 */
export const logger = pino({
	level: process.env.LOG_LEVEL || "info",
	transport: {
		target: "pino-pretty",
		options: {
			colorize: true,
			translateTime: "HH:MM:ss",
			ignore: "pid,hostname",
			singleLine: false,
		},
	},
});
