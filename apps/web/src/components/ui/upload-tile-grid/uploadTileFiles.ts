import type { OrderedPhoto } from '@/lib/storage/orderedPhotos';

/**
 * Appends picked image files after the current photos, skipping duplicates and non-images.
 * Files over the size limit or past the count limit are counted as rejected.
 */
export function mergeFiles({
  currentPhotos,
  incomingFiles,
  maxItemSize,
  maxItems,
}: {
  currentPhotos: OrderedPhoto[];
  incomingFiles: File[];
  maxItemSize: number;
  maxItems: number;
}) {
  const nextPhotos = [...currentPhotos];
  const fileKeys = new Set(
    currentPhotos.flatMap((photo) => (photo.kind === 'file' ? [getFileKey(photo.file)] : [])),
  );
  let rejectedCount = 0;

  for (const file of incomingFiles) {
    const fileKey = getFileKey(file);

    if (!isImageFile(file) || fileKeys.has(fileKey)) {
      continue;
    }

    if (file.size > maxItemSize || nextPhotos.length >= maxItems) {
      rejectedCount += 1;
      continue;
    }

    fileKeys.add(fileKey);
    nextPhotos.push({ file, id: crypto.randomUUID(), kind: 'file' });
  }

  return {
    addedCount: nextPhotos.length - currentPhotos.length,
    photos: nextPhotos,
    rejectedCount,
  };
}

export function formatFileMeta(file: File) {
  const extension = file.name.split('.').pop()?.toUpperCase() ?? 'IMG';
  return `${extension} • ${formatBytes(file.size)}`;
}

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(avif|gif|heic|jpeg|jpg|png|webp)$/i.test(file.name);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
