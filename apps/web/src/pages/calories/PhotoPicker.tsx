import { ImageIcon, Trash2Icon, UploadIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import css from './PhotoPicker.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

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

/** Decode away from the image element and display only a small preview of the camera file. */
async function preparePreview(photo: File, signal: AbortSignal, onReady: (url: string) => void) {
  try {
    const bitmap = await createImageBitmap(photo, {
      resizeWidth: 640,
      resizeQuality: 'medium',
    });
    try {
      if (signal.aborted) return;
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(bitmap, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', 0.8),
      );
      if (!blob) return;
      signal.throwIfAborted();
      onReady(URL.createObjectURL(blob));
    } finally {
      bitmap.close();
    }
  } catch {
    // A failed preview must not prevent uploading the original photo.
  }
}

/** Keeps a single image local until its owner submits the surrounding form. */
export function PhotoPicker({
  allowUpload = true,
  disabled = false,
  existingUrl = null,
  onChange,
  value,
}: PhotoPickerProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const visibleUrl = value.imageAction === 'remove' ? null : (previewUrl ?? existingUrl);

  useEffect(() => {
    if (value.imageAction !== 'replace' || !value.photo) {
      setPreviewUrl(null);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;
    setPreviewUrl(null);

    void preparePreview(value.photo, controller.signal, (url) => {
      objectUrl = url;
      setPreviewUrl(url);
    });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [value.imageAction, value.photo]);

  return (
    <fieldset className={css.root} disabled={disabled}>
      <legend className={css.legend}>{t({ en: 'Photo', pl: 'Zdjęcie' })}</legend>
      <div className={css.card} data-has-image={visibleUrl ? '' : undefined}>
        {visibleUrl ? (
          <img
            alt={t({ en: 'Food', pl: 'Jedzenie' })}
            className={css.preview}
            draggable={false}
            src={visibleUrl}
          />
        ) : (
          <div className={css.placeholder}>
            <ImageIcon aria-hidden='true' className={css.placeholderIcon} />
            <span>{t({ en: 'No photo selected', pl: 'Nie wybrano zdjęcia' })}</span>
          </div>
        )}
        <div aria-live='polite' className={css.status}>
          {value.photo?.name ??
            (visibleUrl
              ? t({ en: 'Photo added', pl: 'Dodano zdjęcie' })
              : t({ en: 'Ready for a photo', pl: 'Gotowe na zdjęcie' }))}
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
              {visibleUrl
                ? t({ en: 'Replace', pl: 'Zamień' })
                : t({ en: 'Upload', pl: 'Prześlij' })}
            </Btn>
          ) : null}
          {visibleUrl ? (
            <Btn
              aria-label={t({ en: 'Remove photo', pl: 'Usuń zdjęcie' })}
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
        capture='environment'
        aria-label={t({ en: 'Upload photo', pl: 'Prześlij zdjęcie' })}
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
