import { Link } from '@tanstack/react-router';
import { PencilIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import type { WeightEntryPhoto } from '../weight.api';
import { WeightPhotoGallery } from './WeightPhotoGallery';
import css from './WeightEntryPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type WeightEntryPageProps = {
  entry: {
    date: string;
    photos: WeightEntryPhoto[];
    weightKg: number;
  };
};

export function WeightEntryPage({ entry }: WeightEntryPageProps) {
  const { formatDate, formatNumber, t } = useI18n();

  return (
    <main className={css.page}>
      <Card as='section' aria-label={t({ en: 'Weight', pl: 'Waga' })} className={css.summary}>
        <div className={css.summaryText}>
          <time dateTime={entry.date}>
            {formatDate(entry.date, {
              day: 'numeric',
              month: 'long',
              weekday: 'long',
              year: 'numeric',
            })}
          </time>
          <strong>
            {formatNumber(entry.weightKg, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}{' '}
            kg
          </strong>
        </div>
        <Btn
          icon={<PencilIcon aria-hidden='true' size={16} strokeWidth={1.9} />}
          isLink
          radius='pill'
          render={<Link params={{ date: entry.date }} to='/weight/$date/edit' />}
          size='sm'
          variant='outlineMain'
        >
          {t({ en: 'Edit', pl: 'Edytuj' })}
        </Btn>
      </Card>

      <Card as='section' aria-labelledby='weight-photos-title' className={css.photosCard}>
        <h1 className={css.title} id='weight-photos-title'>
          {t({ en: 'Progress photos', pl: 'Zdjęcia postępów' })}
        </h1>
        {entry.photos.length > 0 ? (
          <WeightPhotoGallery date={entry.date} photos={entry.photos} />
        ) : (
          <p className={css.empty}>
            {t({ en: 'No photos for this day yet.', pl: 'Brak zdjęć z tego dnia.' })}
          </p>
        )}
      </Card>
    </main>
  );
}
