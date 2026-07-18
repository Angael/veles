const fileIds = new WeakMap<File, number>();
let nextFileId = 1;

/** Adds valid files without conflating distinct files that share browser metadata. */
export function mergeUploadFiles({
  currentFiles,
  incomingFiles,
  maxItemSize,
  maxItems,
}: {
  currentFiles: File[];
  incomingFiles: File[];
  maxItemSize: number;
  maxItems: number;
}) {
  const files = currentFiles.filter((file, index) => currentFiles.indexOf(file) === index);
  let rejectedCount = 0;

  for (const file of incomingFiles) {
    if (!isUploadImageFile(file) || files.includes(file)) {
      continue;
    }

    if (file.size > maxItemSize || files.length >= maxItems) {
      rejectedCount += 1;
      continue;
    }

    files.push(file);
  }

  return { files, rejectedCount };
}

export function areUploadFilesEqual(left: File[], right: File[]) {
  return left.length === right.length && left.every((file, index) => file === right[index]);
}

export function getUploadFileKey(file: File) {
  let id = fileIds.get(file);

  if (id === undefined) {
    id = nextFileId;
    nextFileId += 1;
    fileIds.set(file, id);
  }

  return `upload-${id}`;
}

export function isUploadImageFile(file: File) {
  return file.type.startsWith('image/');
}

export function formatUploadFileMeta(file: File) {
  const lastDotIndex = file.name.lastIndexOf('.');
  const fileExtension =
    lastDotIndex > 0 && lastDotIndex < file.name.length - 1
      ? file.name.slice(lastDotIndex + 1)
      : '';
  const mimeExtension = file.type.startsWith('image/')
    ? (file.type.slice('image/'.length).split('+')[0] ?? '')
    : '';
  const extension = (fileExtension || mimeExtension || 'IMG').toUpperCase();
  return `${extension} • ${formatBytes(file.size)}`;
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
