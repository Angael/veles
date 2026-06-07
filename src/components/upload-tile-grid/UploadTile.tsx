import { XIcon } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import css from './UploadTileGrid.module.css';

type UploadTileProps = {
  file: File;
  metaLabel: string;
  onRemove: () => void;
};

export const UploadTile = memo(function UploadTile({ file, metaLabel, onRemove }: UploadTileProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [file]);

  return (
    <article className={css.tile}>
      {previewUrl ? (
        <img alt={file.name} className={css.preview} draggable={false} src={previewUrl} />
      ) : null}

      <Btn
        aria-label={`Remove ${file.name}`}
        className={css.removeButton}
        icon={<XIcon aria-hidden='true' size={14} strokeWidth={2} />}
        iconOnly
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove();
        }}
        size='sm'
        type='button'
        variant='ghost'
      />

      <div className={css.bottomLeftStack}>
        <span className={css.nameBadge} title={file.name}>
          {file.name}
        </span>

        <span className={css.metaBadge}>{metaLabel}</span>
      </div>
    </article>
  );
});
