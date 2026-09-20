import { and, eq, or } from 'drizzle-orm';
import { userConnections, userSharingSettings } from '@veles/db/schema';
import { db } from '@/server/db.server';

type SharingSetting =
  | typeof userSharingSettings.shareCalories
  | typeof userSharingSettings.shareRecipes
  | typeof userSharingSettings.shareWeight;

/** Builds friend IDs whose selected sharing setting is enabled for embedding as a subquery. */
export function getSharingFriendsIds(userId: string, sharingSetting: SharingSetting) {
  return db
    .select({ userId: userSharingSettings.userId })
    .from(userSharingSettings)
    .innerJoin(
      userConnections,
      or(
        and(
          eq(userConnections.userLowId, userId),
          eq(userConnections.userHighId, userSharingSettings.userId),
        ),
        and(
          eq(userConnections.userHighId, userId),
          eq(userConnections.userLowId, userSharingSettings.userId),
        ),
      ),
    )
    .where(eq(sharingSetting, true));
}
