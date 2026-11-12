import { CameraIcon, PlusIcon, XIcon } from 'lucide-react';
import { useRef } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
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

/** One big camera button at first, then a grid of the taken photos with a tile for one more. */
export function PhotoShots({ maxCount, onAdd, onRemove, processing, shots }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const openCamera = () => inputRef.current?.click();
  const empty = shots.length === 0 && processing === 0;

  return (
    <div className={css.root}>
      {empty ? (
        <button className={css.hero} onClick={openCamera} type='button'>
          <span className={css.heroIcon}>
            <CameraIcon aria-hidden='true' />
          </span>
          <strong>{t({ en: 'Take a photo', pl: 'Zrób zdjęcie' })}</strong>
          <span className={css.hint}>
            {t({
              en: 'Front, back, nutrition table. AI reads everything it can see.',
              pl: 'Przód, tył, tabela wartości. AI odczyta wszystko, co widać.',
            })}
          </span>
        </button>
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
              <li>
                <button className={css.add} onClick={openCamera} type='button'>
                  <PlusIcon aria-hidden='true' />
                  {t({ en: 'Another', pl: 'Kolejne' })}
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
      <input
        accept='image/*'
        aria-label={t({ en: 'Take a photo', pl: 'Zrób zdjęcie' })}
        capture='environment'
        className={css.fileInput}
        multiple
        onChange={(event) => {
          onAdd(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = '';
        }}
        ref={inputRef}
        tabIndex={-1}
        type='file'
      />
    </div>
  );
}
