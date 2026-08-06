import { createMiddleware } from '@tanstack/react-start';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { log } from '@/lib/logger';

export const logMiddleware = (name: string) =>
  createMiddleware({ type: 'request' }).server(async ({ next, request }) => {
    const startedAt = Date.now();
    const method = request.method;
    const _path = new URL(request.url).pathname;
    const path = _path.startsWith('/_serverFn/') ? undefined : _path;

    log.info(`${name} start`, {
      timestamp: new Date().toISOString(),
      method,
      path,
    });

    try {
      const result = await next();

      log.info(`${name} done`, {
        timestamp: new Date().toISOString(),
        method,
        path,
        durationMs: Date.now() - startedAt,
      });

      return result;
    } catch (error) {
      if (error instanceof ClientSafeError) {
        log.info(`${name} rejected`, {
          timestamp: new Date().toISOString(),
          method,
          path,
          durationMs: Date.now() - startedAt,
          reason: error.message,
        });

        throw error;
      }

      log.error(`${name} error`, {
        timestamp: new Date().toISOString(),
        method,
        path,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n') : undefined,
      });

      throw error;
    }
  });
