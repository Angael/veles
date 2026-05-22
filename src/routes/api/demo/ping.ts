import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/demo/ping')({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          message: 'pong',
          timestamp: new Date().toISOString(),
        }),
    },
  },
})
