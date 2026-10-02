import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { addDays } from 'date-fns';
import { and, desc, eq } from 'drizzle-orm';
import { agentCredentials } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { generateAgentToken, hashAgentToken } from '@/server/agentCredentials.server';
import { getServerEnv } from '@/server/env.server';

export const getAgentCredentials = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getAgentCredentials')])
  .handler(async () => {
    const session = await requireSession();
    const credentials = await db
      .select({
        id: agentCredentials.id,
        name: agentCredentials.name,
        createdAt: agentCredentials.createdAt,
        expiresAt: agentCredentials.expiresAt,
      })
      .from(agentCredentials)
      .where(eq(agentCredentials.userId, session.user.id))
      .orderBy(desc(agentCredentials.createdAt));
    return { endpoint: new URL('/api/agent/mcp', getServerEnv().appUrl).href, credentials };
  });

const createAgentCredentialInput = type({ name: 'string.trim |> 0 < string <= 80' });

/** Issues a read-only, 90-day token; only its digest is stored and the secret is returned once. */
export const createAgentCredential = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('createAgentCredential')])
  .validator(arkTypeValidator(createAgentCredentialInput))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const token = generateAgentToken();
    const expiresAt = addDays(new Date(), 90);
    await db.insert(agentCredentials).values({
      name: data.name,
      userId: session.user.id,
      tokenHash: hashAgentToken(token),
      scope: 'read',
      expiresAt,
    });
    return { token, expiresAt };
  });

const revokeAgentCredentialInput = type({ id: 'string.uuid' });

export const revokeAgentCredential = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('revokeAgentCredential')])
  .validator(arkTypeValidator(revokeAgentCredentialInput))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db
      .delete(agentCredentials)
      .where(and(eq(agentCredentials.id, data.id), eq(agentCredentials.userId, session.user.id)));
  });
