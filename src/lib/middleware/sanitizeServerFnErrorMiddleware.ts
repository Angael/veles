import { isNotFound, isRedirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';

export const sanitizeServerFnErrorMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    try {
      return await next();
    } catch (error) {
      if (isNotFound(error) || isRedirect(error)) {
        throw error;
      }

      throw new Error('The request could not be completed. Please try again.');
    }
  },
);
