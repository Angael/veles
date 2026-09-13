import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { eq } from 'drizzle-orm';
import { userSharingSettings } from '@veles/db/schema';
import { db } from '@/server/db.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';

export type SharingSetting = 'calories' | 'recipes' | 'weight';

const defaultSharingSettings = {
  shareCalories: false,
  shareRecipes: false,
  shareWeight: false,
};

/** Loads the signed-in user's sharing preferences, defaulting every category to private. */
export const getSharingSettings = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getSharingSettings')])
  .handler(async () => {
    const session = await requireSession();
    const rows = await db
      .select({
        shareCalories: userSharingSettings.shareCalories,
        shareRecipes: userSharingSettings.shareRecipes,
        shareWeight: userSharingSettings.shareWeight,
      })
      .from(userSharingSettings)
      .where(eq(userSharingSettings.userId, session.user.id))
      .limit(1);

    return rows[0] ?? defaultSharingSettings;
  });

const updateSharingSettingInputType = type({
  enabled: 'boolean',
  setting: "'calories' | 'recipes' | 'weight'",
});

/** Updates one sharing category without overwriting the user's other preferences. */
export const updateSharingSetting = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('updateSharingSetting')])
  .validator(arkTypeValidator(updateSharingSettingInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const changedSetting =
      data.setting === 'calories'
        ? { shareCalories: data.enabled }
        : data.setting === 'recipes'
          ? { shareRecipes: data.enabled }
          : { shareWeight: data.enabled };

    await db
      .insert(userSharingSettings)
      .values({ ...changedSetting, userId: session.user.id })
      .onConflictDoUpdate({
        set: { ...changedSetting, updatedAt: new Date() },
        target: userSharingSettings.userId,
      });
  });
