import { type } from 'arktype';
import { createMiddleware } from '@tanstack/react-start';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';

const contentLengthType = type('string.numeric.parse |> number.integer >= 0');

/**
 * Default fits a full photo form (e.g. 8 × 10 MB) plus multipart overhead. Keep below nginx's
 * client_max_body_size in infra/nginx/nginx.conf.
 */
const PHOTO_FORM_MAX_REQUEST_BYTES = 85 * 1024 * 1024;

/** Rejects requests without a valid `content-length` or above `maxBytes` before the body is parsed. */
export const limitRequestSizeMiddleware = (maxBytes = PHOTO_FORM_MAX_REQUEST_BYTES) =>
  createMiddleware().server(async ({ next, request }) => {
    const contentLength = contentLengthType(request.headers.get('content-length') ?? '');

    if (contentLength instanceof type.errors || contentLength > maxBytes) {
      throw new ClientSafeError('Upload request is too large.');
    }

    return next();
  });
