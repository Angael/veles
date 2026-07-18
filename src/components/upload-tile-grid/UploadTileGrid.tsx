import clsx from 'clsx';
import { UploadIcon } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useId, useRef, useState } from 'react';
import css from './UploadTileGrid.module.css';
import { UploadTile } from './UploadTile';
import {
  areUploadFilesEqual,
  formatUploadFileMeta,
  getUploadFileKey,
  mergeUploadFiles,
} from './uploadFileSelection';

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
    const nextFiles = mergeUploadFiles({
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

    if (!areUploadFilesEqual(files, nextFiles.files)) {
      onFilesChange(nextFiles.files);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!preventDefaultFileDrag(event)) {
      return;
    }

    dragDepthRef.current += 1;
    setIsDragActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!preventDefaultFileDrag(event)) {
      return;
    }

    event.dataTransfer.dropEffect = 'copy';
    setIsDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!preventDefaultFileDrag(event)) {
      return;
    }

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!preventDefaultFileDrag(event)) {
      return;
    }

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
      {files.map((file) => {
        const fileKey = getUploadFileKey(file);

        return (
          <UploadTile
            file={file}
            key={fileKey}
            metaLabel={formatUploadFileMeta(file)}
            onRemove={() => onFilesChange(files.filter((currentFile) => currentFile !== file))}
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
  );
}

function preventDefaultFileDrag(event: DragEvent<HTMLDivElement>) {
  if (!Array.from(event.dataTransfer.types).includes('Files')) {
    return false;
  }

  event.preventDefault();
  return true;
}
