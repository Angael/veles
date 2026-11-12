import { ImageIcon, RotateCwIcon, SparklesIcon, Trash2Icon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { ListItem } from '@/components/ui/list/List';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  useDeleteFoodPhotoScanMutation,
  useRetryFoodPhotoScanMutation,
} from '../photo-scan/foodPhotoScans.query';
import css from './PhotoScanRow.module.css';

type Props = {
  grams: number | null;
  imageUrl: string | null;
  scanId?: string;
  status: 'uploading' | 'pending' | 'processing' | 'failed' | 'done';
};

/** A product on its way into the log: the photo is scanned by a moving light until it is ready. */
export function PhotoScanRow({ grams, imageUrl, scanId, status }: Props) {
  const { formatWhole, t } = useI18n();
  const retryMutation = useRetryFoodPhotoScanMutation();
  const deleteMutation = useDeleteFoodPhotoScanMutation();
  const failed = status === 'failed';

  const titles = {
    failed: { en: 'Could not read this product', pl: 'Nie udało się odczytać produktu' },
    uploading: { en: 'Sending photos…', pl: 'Wysyłanie zdjęć…' },
    working: { en: 'AI is reading the photos…', pl: 'AI czyta zdjęcia…' },
  };
  const title = status === 'failed' || status === 'uploading' ? titles[status] : titles.working;

  return (
    <ListItem className={css.row} data-working={failed ? undefined : ''}>
      <div className={css.media}>
        {imageUrl ? (
          <img alt='' className={css.thumb} src={imageUrl} />
        ) : (
          <ImageIcon aria-hidden='true' className={css.thumb} />
        )}
      </div>
      <div className={css.text}>
        <strong className={css.title}>{t(title)}</strong>
        <span className={css.meta}>
          {grams === null
            ? t({ en: 'Adding product', pl: 'Dodawanie produktu' })
            : `${formatWhole(grams)} g`}
        </span>
      </div>
      {failed && scanId ? (
        <div className={css.actions}>
          <Btn
            aria-label={t({ en: 'Try again', pl: 'Spróbuj ponownie' })}
            icon={<RotateCwIcon aria-hidden='true' />}
            iconOnly
            loading={retryMutation.isPending}
            onClick={() => retryMutation.mutate(scanId)}
            size='sm'
            variant='ghost'
          />
          <Btn
            aria-label={t({ en: 'Delete', pl: 'Usuń' })}
            icon={<Trash2Icon aria-hidden='true' />}
            iconOnly
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(scanId)}
            size='sm'
            variant='ghost'
          />
        </div>
      ) : (
        <SparklesIcon aria-hidden='true' className={css.sparkle} />
      )}
    </ListItem>
  );
}
