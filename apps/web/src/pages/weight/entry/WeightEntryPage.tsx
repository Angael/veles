import { format, parseISO } from 'date-fns';
import { Card } from '@/components/ui/card/Card';
import type { WeightEntryPhoto } from '../weight.api';
import { WEIGHT_PHOTO_MAX_COUNT } from '../weightPhotos.api';
import { AddWeightPhotosForm } from './AddWeightPhotosForm';
import { WeightPhotoGallery } from './WeightPhotoGallery';
import css from './WeightEntryPage.module.css';

type WeightEntryPageProps = {
  entry: {
    date: string;
    photos: WeightEntryPhoto[];
    weightKg: number;
  };
};

export function WeightEntryPage({ entry }: WeightEntryPageProps) {
  const remainingSlots = WEIGHT_PHOTO_MAX_COUNT - entry.photos.length;

  return (
    <main className={css.page}>
      <Card as='section' aria-label='Weight' className={css.summary}>
        <time dateTime={entry.date}>{format(parseISO(entry.date), 'EEEE, MMM d, yyyy')}</time>
        <strong>{entry.weightKg.toFixed(1)} kg</strong>
      </Card>

      <Card as='section' aria-labelledby='weight-photos-title' className={css.photosCard}>
        <h1 className={css.title} id='weight-photos-title'>
          Progress photos
        </h1>
        {entry.photos.length > 0 ? (
          <WeightPhotoGallery date={entry.date} photos={entry.photos} />
        ) : (
          <p className={css.empty}>No photos for this day yet.</p>
        )}
        {remainingSlots > 0 ? (
          <AddWeightPhotosForm date={entry.date} maxItems={remainingSlots} />
        ) : (
          <p className={css.empty}>
            This entry has the maximum of {WEIGHT_PHOTO_MAX_COUNT} photos. Remove one to add
            another.
          </p>
        )}
      </Card>
    </main>
  );
}
