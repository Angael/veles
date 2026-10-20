import sharp from 'sharp';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';
import { log } from '@/server/logger.server';

import { IMAGE_MAX_INPUT_BYTES, IMAGE_MAX_INPUT_PIXELS } from '@/lib/storage/imageLimits';
import { translate } from '@/lib/i18n/getLocale';

/** Converts a validated image into a metadata-free, consistently sized WebP. */
export async function optimizeImage(file: File): Promise<{ buffer: Buffer; type: string }> {
  if (!file.type.startsWith('image/')) {
    throw new ClientSafeError(
      translate({
        en: 'Only image files can be uploaded.',
        pl: 'Można przesyłać tylko pliki graficzne.',
      }),
    );
  }

  if (file.size > IMAGE_MAX_INPUT_BYTES) {
    throw new ClientSafeError(
      translate({ en: 'A photo is too large.', pl: 'Zdjęcie jest za duże.' }),
    );
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());

    if (input.byteLength > IMAGE_MAX_INPUT_BYTES) {
      throw new ClientSafeError(
        translate({ en: 'A photo is too large.', pl: 'Zdjęcie jest za duże.' }),
      );
    }

    const buffer = await sharp(input, {
      failOn: 'none',
      limitInputPixels: IMAGE_MAX_INPUT_PIXELS,
    })
      .rotate()
      .resize({
        fit: 'inside',
        height: 1080,
        width: 1080,
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();

    return { buffer, type: 'image/webp' };
  } catch (error) {
    if (error instanceof ClientSafeError) {
      throw error;
    }

    log.error('Failed to optimize image', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n') : undefined,
    });

    throw new ClientSafeError(
      translate({
        en: 'A photo could not be processed.',
        pl: 'Nie udało się przetworzyć zdjęcia.',
      }),
    );
  }
}
