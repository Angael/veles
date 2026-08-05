import { createCsrfMiddleware, createStart } from '@tanstack/react-start';
import { sanitizeServerFnErrorMiddleware } from '@/lib/middleware/sanitizeServerFnErrorMiddleware';
import { securityHeadersMiddleware } from '@/lib/middleware/securityHeadersMiddleware';

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === 'serverFn',
});

export const startInstance = createStart(() => ({
  functionMiddleware: [sanitizeServerFnErrorMiddleware],
  requestMiddleware: [securityHeadersMiddleware, csrfMiddleware],
}));
