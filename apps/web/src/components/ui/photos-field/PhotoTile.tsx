import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { ImageOffIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { PHOTOS_FORM_FIELD } from '@/lib/storage/imageLimits';
import css from './PhotosField.module.css';

/** A stored photo has a URL; a newly picked one has the file. */
export type FieldPhoto = { id: string; url: string | null } | { file: File; id: string };

type PhotoTileProps = {
  label: string;
  onRemove: (id: string) => void;
  photo: FieldPhoto;
};

/**
 * One sortable square tile; drag anywhere on it to reorder, the corner button removes it.
 * It also renders the photo's form input, so tile order is the submitted order.
 */
export function PhotoTile({ label, onRemove, photo }: PhotoTileProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: photo.id,
  });
  const file = 'file' in photo ? photo.file : null;
  const previewUrl = usePreviewUrl(photo);

  return (
    <article
      {...attributes}
      {...listeners}
      aria-label={`${label}. Drag to reorder.`}
      className={clsx(css.tile, css.sortableTile, isDragging && css.dragging)}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {file ? (
        <input
          hidden
          name={PHOTOS_FORM_FIELD}
          ref={(input) => setInputFile(input, file)}
          type='file'
        />
      ) : (
        <input name={PHOTOS_FORM_FIELD} type='hidden' value={photo.id} />
      )}

      {previewUrl ? (
        <img alt='' className={css.preview} draggable={false} src={previewUrl} />
      ) : null}
      {!previewUrl && !file ? (
        <ImageOffIcon aria-hidden='true' className={css.missingPreview} />
      ) : null}

      <Btn
        aria-label={`Remove ${label}`}
        className={css.removeButton}
        icon={<XIcon aria-hidden='true' size={14} strokeWidth={2} />}
        iconOnly
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove(photo.id);
        }}
        // Keeps Enter/Space on the button from starting a keyboard drag on the tile.
        onKeyDown={(event) => event.stopPropagation()}
        size='sm'
        type='button'
        variant='ghost'
      />

      {file ? <span className={css.metaBadge}>{formatFileMeta(file)}</span> : null}
    </article>
  );
}

/** File inputs can't take a `value`; a DataTransfer list is the only way to set their file. */
function setInputFile(input: HTMLInputElement | null, file: File) {
  if (input && input.files?.[0] !== file) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
  }
}

/** Stored photos already have a URL; picked files get an object URL revoked on cleanup. */
function usePreviewUrl(photo: FieldPhoto) {
  const file = 'file' in photo ? photo.file : null;
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setFileUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  return 'url' in photo ? photo.url : fileUrl;
}

function formatFileMeta(file: File) {
  const extension = file.name.split('.').pop()?.toUpperCase() ?? 'IMG';
  const kb = file.size / 1024;
  return `${extension} • ${kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`}`;
}
