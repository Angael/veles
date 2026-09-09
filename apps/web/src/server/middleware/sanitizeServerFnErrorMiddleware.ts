import { isNotFound, isRedirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';

export const sanitizeServerFnErrorMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    try {
      return await next();
    } catch (error) {
      if (error instanceof ClientSafeError || isNotFound(error) || isRedirect(error)) {
        throw error;
      }

      throw new ClientSafeError('The request could not be completed. Please try again.');
    }
  },
);
