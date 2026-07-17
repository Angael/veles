import { createCsrfMiddleware, createStart } from '@tanstack/react-start';
import { sanitizeServerFnErrorMiddleware } from '@/lib/middleware/sanitizeServerFnErrorMiddleware';

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === 'serverFn',
});

export const startInstance = createStart(() => ({
  functionMiddleware: [sanitizeServerFnErrorMiddleware],
  requestMiddleware: [csrfMiddleware],
}));
