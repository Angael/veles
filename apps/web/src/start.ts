import { createCsrfMiddleware, createStart } from '@tanstack/react-start';
import { sanitizeServerFnErrorMiddleware } from '@/server/middleware/sanitizeServerFnErrorMiddleware';
import { securityHeadersMiddleware } from '@/server/middleware/securityHeadersMiddleware';

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === 'serverFn',
});

export const startInstance = createStart(() => ({
  functionMiddleware: [sanitizeServerFnErrorMiddleware],
  requestMiddleware: [securityHeadersMiddleware, csrfMiddleware],
}));
