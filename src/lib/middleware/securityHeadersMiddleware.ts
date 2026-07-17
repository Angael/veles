import { createMiddleware } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';

export const securityHeadersMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    setResponseHeader('Cache-Control', 'private, no-store');
    setResponseHeader(
      'Content-Security-Policy',
      "base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
    );
    setResponseHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
    setResponseHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    setResponseHeader('X-Content-Type-Options', 'nosniff');
    setResponseHeader('X-Frame-Options', 'DENY');

    if (process.env.NODE_ENV === 'production') {
      setResponseHeader('Strict-Transport-Security', 'max-age=31536000');
    }

    return next();
  },
);
