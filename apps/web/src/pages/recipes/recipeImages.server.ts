import { eq } from 'drizzle-orm';
import { recipeImages, uploadObjects } from '@veles/db/schema';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { translate } from '@/lib/i18n/getLocale';
import { IMAGE_MAX_INPUT_BYTES, PHOTOS_FORM_FIELD } from '@/lib/storage/imageLimits';
import type { DbTransaction } from '@/server/db.server';
import { downloadPublicFile } from '@/server/downloadFile.server';
import { storagePathToUrl } from '@/server/storage/config.server';
import type { PhotoLinkTable } from '@/server/storage/photoSync.server';

export const RECIPE_IMAGE_KEY_PREFIX = 'recipe-images';

export function recipeImageLinks(tx: DbTransaction, recipeId: string): PhotoLinkTable {
  return {
    deleteAll: () => tx.delete(recipeImages).where(eq(recipeImages.recipeId, recipeId)),
    insert: (links) => tx.insert(recipeImages).values(links.map((link) => ({ ...link, recipeId }))),
    selectStored: () =>
      tx
        .select({
          createdAt: recipeImages.createdAt,
          id: recipeImages.id,
          key: uploadObjects.key,
          uploadObjectId: recipeImages.uploadObjectId,
        })
        .from(recipeImages)
        .innerJoin(uploadObjects, eq(uploadObjects.id, recipeImages.uploadObjectId))
        .where(eq(recipeImages.recipeId, recipeId)),
  };
}

/**
 * Turns an ordered list of image URLs into the `photos` form entries that `persistWithPhotos`
 * reads, the same shape the app's photo field submits. The URL of a stored photo keeps that
 * photo; any other URL is downloaded from the public internet.
 */
export async function recipePhotosFromUrls(urls: string[], stored: { id: string; key: string }[]) {
  const storedIdByUrl = new Map(stored.map(({ id, key }) => [storagePathToUrl(key), id]));
  const entries = await Promise.all(
    urls.map(async (url) => storedIdByUrl.get(url) ?? downloadRecipeImage(url)),
  );
  const formData = new FormData();
  for (const entry of entries) formData.append(PHOTOS_FORM_FIELD, entry);
  return formData;
}

async function downloadRecipeImage(url: string) {
  try {
    return await downloadPublicFile(url, IMAGE_MAX_INPUT_BYTES);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    throw new ClientSafeError(
      translate({
        en: `Could not download the image ${url}: ${reason}.`,
        pl: `Nie udało się pobrać zdjęcia ${url}: ${reason}.`,
      }),
    );
  }
}
