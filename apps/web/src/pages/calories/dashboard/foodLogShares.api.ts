import { type } from 'arktype';
import { arkTypeValidator } from '@tanstack/arktype-adapter';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { foodProductCategory, type FoodProductCategory } from '@veles/db/seed/food-products';
import { foodLogShareItems, foodLogShares, foodLogs, foodProducts, users } from '@veles/db/schema';
import { dateOnlyType } from '@/lib/dateOnly';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { fromHundredths, HUNDREDTHS, toHundredths } from '@/lib/nutrition';
import { db } from '@/server/db.server';
import { getConnectedUsers } from '@/server/getConnectedUsers.server';
import { requireSession } from '@/server/getSession.server';
import { logMiddleware } from '@/server/middleware/logMiddleware';
import { storagePathToUrl } from '@/server/storage/config.server';
import { getFoodImageAssets } from '../foodImages.server';
import { translate } from '@/lib/i18n/getLocale';

export type FoodShareRecipient = {
  id: string;
  image: string | null;
  name: string;
};

export type ReceivedFoodLogShare = {
  date: string;
  id: string;
  items: ReceivedFoodLogShareItem[];
  senderName: string;
};

export type ReceivedFoodLogShareItem = {
  id: string;
  name: string;
  grams: number | null;
  kcal: number;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  imageUrl: string | null;
  category: FoodProductCategory | null;
};

/** Lists the friends the signed-in user can send food logs to. */
export const getFoodShareRecipients = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getFoodShareRecipients')])
  .handler(async (): Promise<FoodShareRecipient[]> => {
    const session = await requireSession();
    const connectedUsers = await getConnectedUsers(session.user.id);
    return connectedUsers.map(({ id, image, name }) => ({ id, image, name }));
  });

type SharedFoodLogValues = Pick<
  typeof foodLogs.$inferSelect,
  'gramsHundredths' | 'kcalHundredths' | 'proteinHundredths' | 'fatHundredths' | 'carbsHundredths'
>;

/** Rescales a sender's log to the grams chosen in the share dialog; logs without grams stay as is. */
function scaleSharedLog<T extends SharedFoodLogValues>(
  logEntry: T,
  gramsHundredths: number | null,
): T {
  if (!logEntry.gramsHundredths || gramsHundredths === null) return logEntry;
  const factor = gramsHundredths / logEntry.gramsHundredths;
  const scale = (value: number | null) => (value === null ? null : Math.round(value * factor));
  return {
    ...logEntry,
    gramsHundredths,
    kcalHundredths: Math.round(logEntry.kcalHundredths * factor),
    proteinHundredths: scale(logEntry.proteinHundredths),
    fatHundredths: scale(logEntry.fatHundredths),
    carbsHundredths: scale(logEntry.carbsHundredths),
  };
}

const shareFoodLogsInputType = type({
  date: dateOnlyType,
  items: type({ logId: 'string.uuid', grams: '0 < number <= 100000 | null' })
    .array()
    .atLeastLength(1)
    .atMostLength(200),
  recipientUserIds: type('string[]').atLeastLength(1).atMostLength(50),
});

/**
 * Offers the sender's selected logs to each connected recipient for one diary day. Each item stores its own copy of
 * the log at the chosen grams, so later edits or deletes of the original cannot change the share.
 */
export const shareFoodLogs = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('shareFoodLogs')])
  .validator(arkTypeValidator(shareFoodLogsInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const recipientUserIds = [...new Set(data.recipientUserIds)];
    const connectedUsers = await getConnectedUsers(session.user.id);
    const connectedIds = new Set(connectedUsers.map((user) => user.id));

    if (!recipientUserIds.every((id) => connectedIds.has(id))) {
      throw new ClientSafeError(
        translate({
          en: 'You can only share products with your friends.',
          pl: 'Produkty możesz udostępniać tylko znajomym.',
        }),
      );
    }

    const gramsByLogId = new Map(data.items.map((item) => [item.logId, item.grams]));
    const logs = await db
      .select()
      .from(foodLogs)
      .where(
        and(inArray(foodLogs.id, [...gramsByLogId.keys()]), eq(foodLogs.userId, session.user.id)),
      )
      .orderBy(desc(foodLogs.consumedAt));

    if (logs.length === 0)
      throw new ClientSafeError(
        translate({
          en: 'The selected products no longer exist.',
          pl: 'Wybrane produkty już nie istnieją.',
        }),
      );

    await db.transaction(async (tx) => {
      const shares = await tx
        .insert(foodLogShares)
        .values(
          recipientUserIds.map((recipientUserId) => ({
            logDate: data.date,
            recipientUserId,
            senderUserId: session.user.id,
          })),
        )
        .returning({ id: foodLogShares.id });

      await tx.insert(foodLogShareItems).values(
        shares.flatMap((share) =>
          logs.map((logEntry) => {
            const grams = gramsByLogId.get(logEntry.id) ?? null;
            const shared = scaleSharedLog(logEntry, grams === null ? null : toHundredths(grams));
            return {
              shareId: share.id,
              productId: shared.productId,
              imageUploadObjectId: shared.imageUploadObjectId,
              name: shared.name,
              gramsHundredths: shared.gramsHundredths,
              kcalHundredths: shared.kcalHundredths,
              proteinHundredths: shared.proteinHundredths,
              fatHundredths: shared.fatHundredths,
              carbsHundredths: shared.carbsHundredths,
            };
          }),
        ),
      );
    });
  });

/** Loads pending shares addressed to the signed-in user, newest first, with items in sender order. */
export const getReceivedFoodLogShares = createServerFn({ method: 'GET' })
  .middleware([logMiddleware('getReceivedFoodLogShares')])
  .handler(async (): Promise<ReceivedFoodLogShare[]> => {
    const session = await requireSession();
    const rows = await db
      .select({
        item: foodLogShareItems,
        productImageUploadObjectId: foodProducts.imageUploadObjectId,
        productSeedKey: foodProducts.seedKey,
        senderName: users.name,
        shareDate: foodLogShares.logDate,
        shareId: foodLogShares.id,
      })
      .from(foodLogShares)
      .innerJoin(users, eq(users.id, foodLogShares.senderUserId))
      .innerJoin(foodLogShareItems, eq(foodLogShareItems.shareId, foodLogShares.id))
      .leftJoin(foodProducts, eq(foodProducts.id, foodLogShareItems.productId))
      .where(eq(foodLogShares.recipientUserId, session.user.id))
      .orderBy(desc(foodLogShares.createdAt), asc(foodLogShareItems.id));

    const assetsById = await getFoodImageAssets(
      rows.map((row) => row.item.imageUploadObjectId ?? row.productImageUploadObjectId),
    );
    const sharesById = new Map<string, ReceivedFoodLogShare>();

    for (const row of rows) {
      const { item, productImageUploadObjectId, senderName, shareDate, shareId } = row;
      const asset = assetsById.get(item.imageUploadObjectId ?? productImageUploadObjectId ?? '');
      const share = sharesById.get(shareId) ?? {
        date: shareDate,
        id: shareId,
        items: [],
        senderName,
      };
      sharesById.set(shareId, share);
      share.items.push({
        id: item.id,
        name: item.name,
        grams: fromHundredths(item.gramsHundredths),
        kcal: item.kcalHundredths / HUNDREDTHS,
        protein: fromHundredths(item.proteinHundredths),
        fat: fromHundredths(item.fatHundredths),
        carbs: fromHundredths(item.carbsHundredths),
        imageUrl: asset ? storagePathToUrl(asset.key) : null,
        category: foodProductCategory(row.productSeedKey),
      });
    }

    return [...sharesById.values()];
  });

const foodLogShareIdInputType = type({ id: 'string.uuid' });

/**
 * Copies a pending share into the recipient's diary on the day the sender chose. Deleting the share before
 * inserting logs makes concurrent accepts fail instead of adding the products twice.
 */
export const acceptFoodLogShare = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('acceptFoodLogShare')])
  .validator(arkTypeValidator(foodLogShareIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    const shareOwnedByRecipient = and(
      eq(foodLogShares.id, data.id),
      eq(foodLogShares.recipientUserId, session.user.id),
    );

    await db.transaction(async (tx) => {
      const items = await tx
        .select({ item: foodLogShareItems, logDate: foodLogShares.logDate })
        .from(foodLogShareItems)
        .innerJoin(foodLogShares, eq(foodLogShares.id, foodLogShareItems.shareId))
        .where(shareOwnedByRecipient)
        .orderBy(asc(foodLogShareItems.id));
      const deleted = await tx
        .delete(foodLogShares)
        .where(shareOwnedByRecipient)
        .returning({ id: foodLogShares.id });

      if (deleted.length === 0 || items.length === 0) {
        throw new ClientSafeError(
          translate({
            en: 'These shared products are no longer available.',
            pl: 'Te udostępnione produkty są już niedostępne.',
          }),
        );
      }

      const consumedAt = new Date();
      await tx.insert(foodLogs).values(
        items.map(({ item, logDate }) => ({
          userId: session.user.id,
          productId: item.productId,
          imageUploadObjectId: item.imageUploadObjectId,
          name: item.name,
          gramsHundredths: item.gramsHundredths,
          kcalHundredths: item.kcalHundredths,
          proteinHundredths: item.proteinHundredths,
          fatHundredths: item.fatHundredths,
          carbsHundredths: item.carbsHundredths,
          logDate,
          consumedAt,
        })),
      );
    });
  });

/** Discards a pending share addressed to the signed-in user. */
export const declineFoodLogShare = createServerFn({ method: 'POST' })
  .middleware([logMiddleware('declineFoodLogShare')])
  .validator(arkTypeValidator(foodLogShareIdInputType))
  .handler(async ({ data }) => {
    const session = await requireSession();
    await db
      .delete(foodLogShares)
      .where(
        and(eq(foodLogShares.id, data.id), eq(foodLogShares.recipientUserId, session.user.id)),
      );
  });
