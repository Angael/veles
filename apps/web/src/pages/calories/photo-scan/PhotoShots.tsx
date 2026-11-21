import clsx from 'clsx';
import { CameraIcon, ImagesIcon, XIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { usePhotoSource } from '@/components/ui/photo-source/usePhotoSource';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { PhotoShot } from './usePhotoShots';
import css from './PhotoShots.module.css';

type Props = {
  maxCount: number;
  onAdd: (files: File[]) => void;
  onRemove: (shot: PhotoShot) => void;
  processing: number;
  shots: PhotoShot[];
};

/** A big camera/gallery prompt at first, then a grid of the added photos with a tile for one more. */
export function PhotoShots({ maxCount, onAdd, onRemove, processing, shots }: Props) {
  const { t } = useI18n();
  const photoSource = usePhotoSource({ multiple: true, onFiles: onAdd });
  const empty = shots.length === 0 && processing === 0;

  return (
    <div className={css.root}>
      {empty ? (
        <div className={css.hero}>
          <span className={css.heroIcon}>
            <CameraIcon aria-hidden='true' />
          </span>
          <strong>{t({ en: 'Add a photo', pl: 'Dodaj zdjęcie' })}</strong>
          <span className={css.hint}>
            {t({
              en: 'Front, back, nutrition table. AI reads everything it can see.',
              pl: 'Przód, tył, tabela wartości. AI odczyta wszystko, co widać.',
            })}
          </span>
          <div className={css.heroActions}>
            <Btn
              className={photoSource.cameraClassName}
              icon={<CameraIcon aria-hidden='true' />}
              onClick={photoSource.openCamera}
              type='button'
            >
              {t({ en: 'Camera', pl: 'Aparat' })}
            </Btn>
            <Btn
              icon={<ImagesIcon aria-hidden='true' />}
              onClick={photoSource.openGallery}
              type='button'
              variant='white'
            >
              {t({ en: 'Gallery', pl: 'Galeria' })}
            </Btn>
          </div>
        </div>
      ) : (
        <>
          <ul className={css.grid}>
            {shots.map((shot, index) => (
              <li className={css.tile} key={shot.id}>
                <img
                  alt={t({ en: `Photo ${index + 1}`, pl: `Zdjęcie ${index + 1}` })}
                  className={css.image}
                  draggable={false}
                  src={shot.url}
                />
                <Btn
                  aria-label={t({
                    en: `Remove photo ${index + 1}`,
                    pl: `Usuń zdjęcie ${index + 1}`,
                  })}
                  className={css.remove}
                  icon={<XIcon aria-hidden='true' />}
                  iconOnly
                  onClick={() => onRemove(shot)}
                  size='sm'
                  type='button'
                  variant='white'
                />
              </li>
            ))}
            {Array.from({ length: processing }, (_, index) => (
              <li aria-hidden='true' className={css.processing} key={index} />
            ))}
            {shots.length + processing < maxCount ? (
              <li className={css.add}>
                <button
                  className={clsx(css.addButton, photoSource.cameraClassName)}
                  onClick={photoSource.openCamera}
                  type='button'
                >
                  <CameraIcon aria-hidden='true' />
                  {t({ en: 'Camera', pl: 'Aparat' })}
                </button>
                <button className={css.addButton} onClick={photoSource.openGallery} type='button'>
                  <ImagesIcon aria-hidden='true' />
                  {t({ en: 'Gallery', pl: 'Galeria' })}
                </button>
              </li>
            ) : null}
          </ul>
          <p className={css.hint}>
            {t({
              en: 'Add the nutrition table or net weight if they are not visible yet.',
              pl: 'Dodaj tabelę wartości lub gramaturę, jeśli ich jeszcze nie widać.',
            })}
          </p>
        </>
      )}
      {photoSource.inputs}
    </div>
  );
}
