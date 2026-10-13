import { and, eq } from 'drizzle-orm';
import { userAgentPermissions } from '@veles/db/schema';
import {
  agentFeatures,
  agentFeatureType,
  defaultAgentPermissions,
  type AgentFeature,
} from '@/lib/agentAccess';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { db } from './db.server';

/** Loads current consent without session caching so account changes affect existing keys. */
export async function readAgentPermissions(userId: string) {
  const permissions = defaultAgentPermissions();
  const rows = await db
    .select()
    .from(userAgentPermissions)
    .where(eq(userAgentPermissions.userId, userId));
  for (const row of rows) {
    if (!agentFeatureType.allows(row.feature)) continue;
    permissions[row.feature] = {
      read: row.readEnabled,
      write: row.readEnabled && row.writeEnabled && agentFeatures[row.feature].writeAvailable,
    };
  }
  return permissions;
}

/** Rechecks the requested operation at tool execution; write also needs read consent. */
export async function requireAgentAccess(
  userId: string,
  feature: AgentFeature,
  access: 'read' | 'write',
) {
  const [row] = await db
    .select()
    .from(userAgentPermissions)
    .where(and(eq(userAgentPermissions.userId, userId), eq(userAgentPermissions.feature, feature)))
    .limit(1);
  const allowed =
    access === 'read'
      ? row?.readEnabled
      : row?.readEnabled && row.writeEnabled && agentFeatures[feature].writeAvailable;
  if (!allowed) {
    throw new ClientSafeError(
      `${agentFeatures[feature].label} ${access} access is disabled in Account.`,
    );
  }
}
