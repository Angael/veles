import { createMiddleware } from '@tanstack/react-start';
import { log } from '@/lib/logger';

export const logMiddleware = (name: string) =>
  createMiddleware({ type: 'request' }).server(async ({ next, request }) => {
    const startedAt = Date.now();
    const timestamp = new Date().toISOString();
    const method = request.method;
    const _path = new URL(request.url).pathname;
    const path = _path.startsWith('/_serverFn/') ? undefined : _path;

    log.info(`${name} start`, {
      timestamp,
      method,
      path,
    });

    try {
      const result = await next();

      log.info(`${name} done`, {
        timestamp,
        method,
        path,
        durationMs: Date.now() - startedAt,
      });

      return result;
    } catch (error) {
      log.error(`${name} error`, {
        timestamp,
        method,
        path,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n') : undefined,
      });

      throw error;
    }
  });
