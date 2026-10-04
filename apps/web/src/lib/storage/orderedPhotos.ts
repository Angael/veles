import { type } from 'arktype';
import { ClientSafeError } from '@/lib/errors/ClientSafeError';

/** One photo in an editable list: already stored on the server, or a newly picked file. */
export type OrderedPhoto =
  | { id: string; kind: 'stored'; url: string | null }
  | { file: File; id: string; kind: 'file' };

export type PhotoOrderSlot = { id: string; kind: 'stored' } | { file: File; kind: 'file' };

const PHOTO_ORDER_FIELD = 'photoOrder';
const PHOTO_FILE_FIELD = 'photos';
const NEW_PHOTO_SLOT = 'new';

const photoOrderType = type(`(string.uuid | '${NEW_PHOTO_SLOT}')[]`);

/** Seeds an editable photo list from photos loaded from the server. */
export function toStoredPhotos(photos: Array<{ id: string; url: string | null }>): OrderedPhoto[] {
  return photos.map((photo) => ({ id: photo.id, kind: 'stored', url: photo.url }));
}

/**
 * Serializes an edited photo list into multipart fields: every photo gets one order slot (its
 * stored id, or `new` for a file), and files are appended in the same order as their slots.
 */
export function appendOrderedPhotos(formData: FormData, photos: OrderedPhoto[]) {
  for (const photo of photos) {
    if (photo.kind === 'stored') {
      formData.append(PHOTO_ORDER_FIELD, photo.id);
    } else {
      formData.append(PHOTO_ORDER_FIELD, NEW_PHOTO_SLOT);
      formData.append(PHOTO_FILE_FIELD, photo.file);
    }
  }
}

/** Rebuilds the ordered slots written by `appendOrderedPhotos` and enforces count/size limits. */
export function readOrderedPhotos(
  formData: FormData,
  limits: { maxBytes: number; maxCount: number },
): PhotoOrderSlot[] {
  const order = photoOrderType(formData.getAll(PHOTO_ORDER_FIELD));
  const files = formData
    .getAll(PHOTO_FILE_FIELD)
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (order instanceof type.errors) {
    throw new ClientSafeError('Photo order is invalid.');
  }

  const storedIds = order.filter((slot) => slot !== NEW_PHOTO_SLOT);

  if (
    order.length - storedIds.length !== files.length ||
    new Set(storedIds).size !== storedIds.length
  ) {
    throw new ClientSafeError('Photo order is invalid.');
  }

  if (order.length > limits.maxCount) {
    throw new ClientSafeError(`Up to ${limits.maxCount} photos are allowed.`);
  }

  if (files.some((file) => file.size > limits.maxBytes)) {
    throw new ClientSafeError('A photo is too large.');
  }

  const remainingFiles = files.values();

  return order.map((slot): PhotoOrderSlot => {
    if (slot !== NEW_PHOTO_SLOT) {
      return { id: slot, kind: 'stored' };
    }

    // oxlint-disable-next-line typescript/no-non-null-assertion -- file count matches `new` slots after the guard above.
    return { file: remainingFiles.next().value!, kind: 'file' };
  });
}
