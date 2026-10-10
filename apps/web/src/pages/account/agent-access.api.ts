import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { userAgentPermissions } from '@veles/db/schema';
import { agentFeatureNames, agentFeatures, agentFeatureType } from '@/lib/agentAccess';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { readAgentPermissions } from '@/server/agentAccess.server';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';

/** Write needs read: granting write also grants read, and revoking read also revokes write. */
function consentChange(access: 'read' | 'write', enabled: boolean) {
  if (access === 'read')
    return enabled ? { readEnabled: true } : { readEnabled: false, writeEnabled: false };
  return enabled ? { readEnabled: true, writeEnabled: true } : { writeEnabled: false };
}

export const getAgentPermissions = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getAgentPermissions')])
  .handler(async () => {
    const session = await requireSession();
    return readAgentPermissions(session.user.id);
  });

const updateAgentPermissionInputType = type({
  '+': 'reject',
  feature: agentFeatureType,
  access: "'read' | 'write'",
  enabled: 'boolean',
});

/** Saves one consent switch without overwriting other permissions or granting future writes. */
export const updateAgentPermission = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateAgentPermission')])
  .validator(arkTypeValidator(updateAgentPermissionInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    if (data.access === 'write' && data.enabled && !agentFeatures[data.feature].writeAvailable) {
      throw new ClientSafeError('Write access for this feature is coming soon.');
    }
    const changed = consentChange(data.access, data.enabled);
    await db
      .insert(userAgentPermissions)
      .values({ userId: session.user.id, feature: data.feature, ...changed })
      .onConflictDoUpdate({
        target: [userAgentPermissions.userId, userAgentPermissions.feature],
        set: changed,
      });
  });

const setAllAgentPermissionsInputType = type({
  '+': 'reject',
  access: "'read' | 'write'",
  enabled: 'boolean',
});

/** Flips read or write for every feature at once; write skips features whose writes are not live yet. */
export const setAllAgentPermissions = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('setAllAgentPermissions')])
  .validator(arkTypeValidator(setAllAgentPermissionsInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const features = agentFeatureNames.filter(
      (feature) => data.access === 'read' || agentFeatures[feature].writeAvailable,
    );
    const changed = consentChange(data.access, data.enabled);
    await db
      .insert(userAgentPermissions)
      .values(features.map((feature) => ({ userId: session.user.id, feature, ...changed })))
      .onConflictDoUpdate({
        target: [userAgentPermissions.userId, userAgentPermissions.feature],
        set: changed,
      });
  });
