import { createFileRoute } from '@tanstack/react-router';
import { handleAgentMcp } from '@/pages/agent/agent.api';

export const Route = createFileRoute('/api/agent/mcp')({
  server: {
    handlers: {
      GET: ({ request }) => handleAgentMcp(request),
      POST: ({ request }) => handleAgentMcp(request),
      DELETE: ({ request }) => handleAgentMcp(request),
    },
  },
});
