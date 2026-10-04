import { Link } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { PencilIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import type { WeightEntryPhoto } from '../weight.api';
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
  return (
    <main className={css.page}>
      <Card as='section' aria-label='Weight' className={css.summary}>
        <div className={css.summaryText}>
          <time dateTime={entry.date}>{format(parseISO(entry.date), 'EEEE, MMM d, yyyy')}</time>
          <strong>{entry.weightKg.toFixed(1)} kg</strong>
        </div>
        <Btn
          icon={<PencilIcon aria-hidden='true' size={16} strokeWidth={1.9} />}
          isLink
          radius='pill'
          render={<Link params={{ date: entry.date }} to='/weight/$date/edit' />}
          size='sm'
          variant='outlineMain'
        >
          Edit
        </Btn>
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
      </Card>
    </main>
  );
}
