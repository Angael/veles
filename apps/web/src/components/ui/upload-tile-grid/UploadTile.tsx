import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { ImageOffIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import type { OrderedPhoto } from '@/lib/storage/orderedPhotos';
import css from './UploadTileGrid.module.css';

type UploadTileProps = {
  label: string;
  metaLabel: string | null;
  onRemove: (id: string) => void;
  photo: OrderedPhoto;
};

/** One sortable square tile; drag anywhere on it to reorder, the corner button removes it. */
export function UploadTile({ label, metaLabel, onRemove, photo }: UploadTileProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: photo.id,
  });
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
      {previewUrl ? (
        <img alt='' className={css.preview} draggable={false} src={previewUrl} />
      ) : null}
      {!previewUrl && photo.kind === 'stored' ? (
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

      {metaLabel ? <span className={css.metaBadge}>{metaLabel}</span> : null}
    </article>
  );
}

/** Stored photos already have a URL; picked files get an object URL revoked on cleanup. */
function usePreviewUrl(photo: OrderedPhoto) {
  const file = photo.kind === 'file' ? photo.file : null;
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

  return photo.kind === 'stored' ? photo.url : fileUrl;
}
