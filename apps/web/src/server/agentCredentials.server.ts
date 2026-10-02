import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import { agentCredentials } from '@veles/db/schema';
import { db } from '@/server/db.server';

export function hashAgentToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function generateAgentToken() {
  return `vls_ro_${randomBytes(32).toString('base64url')}`;
}

/** Looks up the hashed credential on every request so revocation also stops existing MCP clients. */
export async function authenticateAgent(request: Request) {
  const match = /^Bearer (vls_ro_[A-Za-z0-9_-]{43})$/.exec(
    request.headers.get('authorization') ?? '',
  );
  if (!match?.[1]) return null;

  const [credential] = await db
    .select({ id: agentCredentials.id, userId: agentCredentials.userId })
    .from(agentCredentials)
    .where(
      and(
        eq(agentCredentials.tokenHash, hashAgentToken(match[1])),
        eq(agentCredentials.scope, 'read'),
        gt(agentCredentials.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return credential ?? null;
}
