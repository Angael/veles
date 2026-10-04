import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import clsx from 'clsx';
import { UploadIcon } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useId, useRef, useState } from 'react';
import type { OrderedPhoto } from '@/lib/storage/orderedPhotos';
import css from './UploadTileGrid.module.css';
import { UploadTile } from './UploadTile';
import { formatFileMeta, mergeFiles } from './uploadTileFiles';

type UploadTileGridProps = {
  className?: string;
  maxItemSize: number;
  maxItems: number;
  onPhotosChange: (photos: OrderedPhoto[]) => void;
  photos: OrderedPhoto[];
};

/**
 * Square photo grid for picking, removing, and drag-reordering images. Holds stored photos and
 * new files side by side so edit forms can submit one ordered list.
 */
export function UploadTileGrid({
  className,
  maxItemSize,
  maxItems,
  onPhotosChange,
  photos,
}: UploadTileGridProps) {
  const dndContextId = useId();
  const inputId = useId();
  const dragDepthRef = useRef(0);
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Long-press on touch so swiping over the grid still scrolls the page.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function addFiles(incomingFiles: File[]) {
    const result = mergeFiles({ currentPhotos: photos, incomingFiles, maxItemSize, maxItems });

    if (result.rejectedCount > 0) {
      window.alert(
        `${result.rejectedCount} item${result.rejectedCount === 1 ? '' : 's'} were not added because of the limit.`,
      );
    }

    if (result.addedCount > 0) {
      onPhotosChange(result.photos);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  }

  function handleSortEnd({ active, over }: DragEndEvent) {
    const fromIndex = photos.findIndex((photo) => photo.id === active.id);
    const toIndex = photos.findIndex((photo) => photo.id === over?.id);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      onPhotosChange(arrayMove(photos, fromIndex, toIndex));
    }
  }

  function handleRemove(id: string) {
    onPhotosChange(photos.filter((photo) => photo.id !== id));
  }

  return (
    <div
      className={clsx(css.root, isFileDragActive && css.dragActive, className)}
      onDragEnter={(event) => {
        if (preventDefaultFileDrag(event)) {
          dragDepthRef.current += 1;
          setIsFileDragActive(true);
        }
      }}
      onDragLeave={(event) => {
        if (preventDefaultFileDrag(event)) {
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          setIsFileDragActive(dragDepthRef.current > 0);
        }
      }}
      onDragOver={(event) => {
        if (preventDefaultFileDrag(event)) {
          event.dataTransfer.dropEffect = 'copy';
        }
      }}
      onDrop={(event) => {
        if (preventDefaultFileDrag(event)) {
          dragDepthRef.current = 0;
          setIsFileDragActive(false);
          addFiles(Array.from(event.dataTransfer.files));
        }
      }}
    >
      <DndContext
        collisionDetection={closestCenter}
        id={dndContextId}
        onDragEnd={handleSortEnd}
        sensors={sensors}
      >
        <SortableContext items={photos} strategy={rectSortingStrategy}>
          {photos.map((photo, index) => (
            <UploadTile
              key={photo.id}
              label={`Photo ${index + 1}`}
              metaLabel={photo.kind === 'file' ? formatFileMeta(photo.file) : null}
              onRemove={handleRemove}
              photo={photo}
            />
          ))}
        </SortableContext>
      </DndContext>

      {photos.length < maxItems ? (
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
          <span>{photos.length ? 'Drop here or browse' : `Up to ${maxItems} images`}</span>
        </label>
      ) : null}
    </div>
  );
}

/** Only reacts to OS file drags; tile reordering uses pointer events, not native drag. */
function preventDefaultFileDrag(event: DragEvent<HTMLDivElement>) {
  if (!Array.from(event.dataTransfer.types).includes('Files')) {
    return false;
  }

  event.preventDefault();
  return true;
}
