import { ImageIcon, Trash2Icon, UploadIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Btn } from '@/components/btn/Btn';
import css from './PhotoPicker.module.css';

export type PhotoPickerValue = {
  imageAction: 'keep' | 'replace' | 'remove';
  photo?: File;
};

type PhotoPickerProps = {
  allowUpload?: boolean;
  disabled?: boolean;
  existingUrl?: string | null;
  onChange: (value: PhotoPickerValue) => void;
  value: PhotoPickerValue;
};

/** Keeps a single image local until its owner submits the surrounding form. */
export function PhotoPicker({
  allowUpload = true,
  disabled = false,
  existingUrl = null,
  onChange,
  value,
}: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const visibleUrl = value.imageAction === 'remove' ? null : (previewUrl ?? existingUrl);

  useEffect(() => {
    if (value.imageAction !== 'replace' || !value.photo) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(value.photo);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [value.imageAction, value.photo]);

  return (
    <fieldset className={css.root} disabled={disabled}>
      <legend className={css.legend}>Photo</legend>
      <div className={css.card} data-has-image={visibleUrl ? '' : undefined}>
        {visibleUrl ? (
          <img alt='Food' className={css.preview} draggable={false} src={visibleUrl} />
        ) : (
          <div className={css.placeholder}>
            <ImageIcon aria-hidden='true' className={css.placeholderIcon} />
            <span>No photo selected</span>
          </div>
        )}
        <div aria-live='polite' className={css.status}>
          {value.photo?.name ?? (visibleUrl ? 'Photo added' : 'Ready for a photo')}
        </div>
        <div className={css.actions}>
          {allowUpload ? (
            <Btn
              className={css.action}
              icon={<UploadIcon aria-hidden='true' />}
              onClick={() => inputRef.current?.click()}
              size='sm'
              type='button'
              variant='white'
            >
              {visibleUrl ? 'Replace' : 'Upload'}
            </Btn>
          ) : null}
          {visibleUrl ? (
            <Btn
              aria-label='Remove photo'
              className={css.action}
              icon={<Trash2Icon aria-hidden='true' />}
              iconOnly
              onClick={() => {
                if (inputRef.current) inputRef.current.value = '';
                onChange({ imageAction: 'remove' });
              }}
              size='sm'
              type='button'
              variant='white'
            />
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        accept='image/*'
        aria-label='Upload photo'
        className={css.fileInput}
        onChange={(event) => {
          const [photo] = Array.from(event.target.files ?? []);
          if (photo) onChange({ imageAction: 'replace', photo });
        }}
        tabIndex={-1}
        type='file'
      />
    </fieldset>
  );
}
