import { createCsrfMiddleware, createStart } from '@tanstack/react-start';
import { sanitizeServerFnErrorMiddleware } from '@/lib/middleware/sanitizeServerFnErrorMiddleware';
import { securityHeadersMiddleware } from '@/lib/middleware/securityHeadersMiddleware';

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) =>
    context.handlerType === 'serverFn' ||
    (context.request.method === 'POST' &&
      new URL(context.request.url).pathname === '/api/recipes/upload'),
});

export const startInstance = createStart(() => ({
  functionMiddleware: [sanitizeServerFnErrorMiddleware],
  requestMiddleware: [securityHeadersMiddleware, csrfMiddleware],
}));
