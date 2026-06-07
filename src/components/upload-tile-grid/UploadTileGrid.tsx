import clsx from 'clsx';
import { UploadIcon } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useId, useRef, useState } from 'react';
import css from './UploadTileGrid.module.css';
import { UploadTile } from './UploadTile';

type UploadTileGridProps = {
  className?: string;
  files: File[];
  maxItemSize: number;
  maxItems: number;
  onFilesChange: (files: File[]) => void;
};

export function UploadTileGrid({
  className,
  files,
  maxItemSize,
  maxItems,
  onFilesChange,
}: UploadTileGridProps) {
  const inputId = useId();
  const dragDepthRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);

  function addFiles(incomingFiles: Iterable<File>) {
    const nextFiles = mergeFiles({
      currentFiles: files,
      incomingFiles: Array.from(incomingFiles),
      maxItemSize,
      maxItems,
    });

    if (nextFiles.rejectedCount > 0) {
      window.alert(
        `${nextFiles.rejectedCount} item${nextFiles.rejectedCount === 1 ? '' : 's'} were not added because of the limit.`,
      );
    }

    if (!areFilesEqual(files, nextFiles.files)) {
      onFilesChange(nextFiles.files);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragActive(false);
    addFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <div
      className={clsx(css.root, isDragActive && css.dragActive, className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={css.grid}>
        {files.map((file) => {
          const fileKey = getFileKey(file);

          return (
            <UploadTile
              file={file}
              key={fileKey}
              metaLabel={formatFileMeta(file)}
              onRemove={() =>
                onFilesChange(files.filter((currentFile) => getFileKey(currentFile) !== fileKey))
              }
            />
          );
        })}

        <label className={clsx(css.tile, css.uploadTile)} htmlFor={inputId}>
          <input
            accept='image/*'
            className={css.fileInput}
            id={inputId}
            multiple
            onChange={handleInputChange}
            type='file'
          />

          <UploadIcon aria-hidden='true' size={20} strokeWidth={1.9} />
          <strong>Add images</strong>
          <span>{files.length ? 'Drop here or browse' : `Up to ${maxItems} images`}</span>
        </label>
      </div>
    </div>
  );
}

function hasDraggedFiles(event: DragEvent<HTMLDivElement>) {
  return Array.from(event.dataTransfer.types).includes('Files');
}

function mergeFiles({
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
  const nextFiles = new Map(currentFiles.map((file) => [getFileKey(file), file]));
  let rejectedCount = 0;

  for (const file of incomingFiles) {
    if (!isImageFile(file)) {
      continue;
    }

    const fileKey = getFileKey(file);

    if (nextFiles.has(fileKey)) {
      continue;
    }

    if (file.size > maxItemSize) {
      rejectedCount += 1;
      continue;
    }

    if (nextFiles.size >= maxItems) {
      rejectedCount += 1;
      continue;
    }

    nextFiles.set(fileKey, file);
  }

  return {
    files: Array.from(nextFiles.values()),
    rejectedCount,
  };
}

function areFilesEqual(left: File[], right: File[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((file, index) => getFileKey(file) === getFileKey(right[index]));
}

function getFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(avif|gif|heic|jpeg|jpg|png|webp)$/i.test(file.name);
}

function formatFileMeta(file: File) {
  const extension = file.name.split('.').pop()?.toUpperCase() ?? 'IMG';
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
