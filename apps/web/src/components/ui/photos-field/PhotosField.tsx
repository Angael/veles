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
import { type DragEvent, useId, useRef, useState } from 'react';
import { IMAGE_MAX_INPUT_BYTES } from '@/lib/storage/imageLimits';
import css from './PhotosField.module.css';
import { type FieldPhoto, PhotoTile } from './PhotoTile';

type PhotosFieldProps = {
  /** Photos already stored on the server, in their saved order. */
  defaultPhotos?: Array<{ id: string; url: string | null }>;
  label?: string;
  maxBytes?: number;
  maxCount: number;
  /** Called after every add, remove, or reorder; use it to mark the form dirty. */
  onChange?: () => void;
};

/**
 * Labelled square photo grid for picking, removing, and drag-reordering images. It works like a
 * native input: each tile renders a `photos` form entry (stored id or new file) in tile order, so
 * any `<form>` submits the list with no extra code. Read it on the server with `persistWithPhotos`.
 */
export function PhotosField({
  defaultPhotos = [],
  label = 'Photos',
  maxBytes = IMAGE_MAX_INPUT_BYTES,
  maxCount,
  onChange,
}: PhotosFieldProps) {
  const dndContextId = useId();
  const inputId = useId();
  const dragDepthRef = useRef(0);
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const [photos, setPhotos] = useState<FieldPhoto[]>(defaultPhotos);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Long-press on touch so swiping over the grid still scrolls the page.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function changePhotos(nextPhotos: FieldPhoto[]) {
    setPhotos(nextPhotos);
    onChange?.();
  }

  /** Appends new image files at the end; skips non-images and repeats, rejects files over limits. */
  function addFiles(files: File[]) {
    const images = files.filter(
      (file) =>
        isImageFile(file) &&
        !photos.some((photo) => 'file' in photo && isSameFile(photo.file, file)),
    );
    const accepted = images
      .filter((file) => file.size <= maxBytes)
      .slice(0, maxCount - photos.length);
    const rejectedCount = images.length - accepted.length;

    if (rejectedCount > 0) {
      window.alert(
        `${rejectedCount} item${rejectedCount === 1 ? '' : 's'} were not added because of the limit.`,
      );
    }

    if (accepted.length > 0) {
      changePhotos([...photos, ...accepted.map((file) => ({ file, id: crypto.randomUUID() }))]);
    }
  }

  function handleSortEnd({ active, over }: DragEndEvent) {
    const fromIndex = photos.findIndex((photo) => photo.id === active.id);
    const toIndex = photos.findIndex((photo) => photo.id === over?.id);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      changePhotos(arrayMove(photos, fromIndex, toIndex));
    }
  }

  return (
    <div className={css.root}>
      <span>{label}</span>
      <div
        className={clsx(css.grid, isFileDragActive && css.dragActive)}
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
              <PhotoTile
                key={photo.id}
                label={`Photo ${index + 1}`}
                onRemove={(id) => changePhotos(photos.filter((item) => item.id !== id))}
                photo={photo}
              />
            ))}
          </SortableContext>
        </DndContext>

        {photos.length < maxCount ? (
          <label className={clsx(css.tile, css.uploadTile)} htmlFor={inputId}>
            {/* No `name`: picked files are submitted by the tiles, in tile order. */}
            <input
              accept='image/*'
              className={css.fileInput}
              id={inputId}
              multiple
              onChange={(event) => {
                addFiles(Array.from(event.currentTarget.files ?? []));
                event.currentTarget.value = '';
              }}
              type='file'
            />

            <UploadIcon aria-hidden='true' size={20} strokeWidth={1.9} />
            <strong>Add images</strong>
            <span>{photos.length ? 'Drop here or browse' : `Up to ${maxCount} images`}</span>
          </label>
        ) : null}
      </div>
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

function isSameFile(a: File, b: File) {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
}

function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(avif|gif|heic|jpeg|jpg|png|webp)$/i.test(file.name);
}
