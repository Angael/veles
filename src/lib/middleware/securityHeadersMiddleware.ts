import { createMiddleware } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';

export const securityHeadersMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ next }) => {
    // Prevent browsers and shared intermediaries from retaining private user data.
    setResponseHeader('Cache-Control', 'private, no-store');
    // Block framing, plugin content, and hostile base URLs through a minimal CSP.
    setResponseHeader(
      'Content-Security-Policy',
      "base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
    );
    // Disable sensitive browser capabilities that this app does not use.
    setResponseHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
    // Avoid leaking full private URLs when navigating to another origin.
    setResponseHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Prevent content-type sniffing from turning non-script responses into executable content.
    setResponseHeader('X-Content-Type-Options', 'nosniff');
    // Deny legacy-browser framing as defense in depth against clickjacking.
    setResponseHeader('X-Frame-Options', 'DENY');

    if (process.env.NODE_ENV === 'production') {
      // Force future visits over HTTPS to prevent protocol downgrade attacks.
      setResponseHeader('Strict-Transport-Security', 'max-age=31536000');
    }

    return next();
  },
);
