import { type } from 'arktype';
import { createMiddleware } from '@tanstack/react-start';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';

const contentLengthType = type('string.numeric.parse |> number.integer >= 0');

/**
 * Rejects requests without a valid `content-length` or above `maxBytes` before the body is parsed.
 * Keep limits below nginx's client_max_body_size in infra/nginx/nginx.conf.
 */
export const limitRequestSizeMiddleware = (maxBytes: number) =>
  createMiddleware().server(async ({ next, request }) => {
    const contentLength = contentLengthType(request.headers.get('content-length') ?? '');

    if (contentLength instanceof type.errors || contentLength > maxBytes) {
      throw new ClientSafeError('Upload request is too large.');
    }

    return next();
  });
