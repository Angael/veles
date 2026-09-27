import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { type } from 'arktype';
import type { GithubClient } from './types.ts';

const webhookType = type({
  repository: { full_name: 'string' },
  installation: { id: 'number.integer' },
});

/** Accept signed PR events only; fetch current state instead of trusting delivery order. */
export function createApp({
  github,
  repository,
  installationId,
  schedule,
}: {
  github: GithubClient;
  repository: string;
  installationId: string;
  schedule: () => void;
}) {
  const app = new Hono();
  app.get('/health', (c) => c.text('ok'));
  app.post('/webhook', bodyLimit({ maxSize: 1024 * 1024 }), async (c) => {
    const body = new Uint8Array(await c.req.arrayBuffer());
    if (!github.verify(body, c.req.header('x-hub-signature-256')))
      return c.text('Invalid signature', 401);
    if (c.req.header('x-github-event') === 'ping') return c.text('pong');
    if (c.req.header('x-github-event') !== 'pull_request') return c.body(null, 202);
    let payload: unknown;
    try {
      payload = JSON.parse(new TextDecoder().decode(body));
    } catch {
      return c.text('Invalid payload', 400);
    }
    const event = webhookType(payload);
    if (event instanceof type.errors) return c.text('Invalid payload', 400);
    if (
      event.repository.full_name !== repository ||
      String(event.installation.id) !== installationId
    )
      return c.body(null, 202);
    schedule();
    return c.body(null, 202);
  });
  return app;
}
