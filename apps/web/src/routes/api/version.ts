import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/version')({
  server: {
    handlers: {
      GET: () =>
        Response.json({ buildId: __BUILD_ID__ }, { headers: { 'Cache-Control': 'no-store' } }),
    },
  },
});
