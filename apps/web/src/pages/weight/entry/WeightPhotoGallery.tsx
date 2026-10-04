import { format, parseISO } from 'date-fns';
import { ImageOffIcon } from 'lucide-react';
import type { WeightEntryPhoto } from '../weight.api';
import css from './WeightEntryPage.module.css';

type WeightPhotoGalleryProps = {
  date: string;
  photos: WeightEntryPhoto[];
};

export function WeightPhotoGallery({ date, photos }: WeightPhotoGalleryProps) {
  const dateLabel = format(parseISO(date), 'MMM d, yyyy');

  return (
    <ul className={css.gallery}>
      {photos.map((photo, index) => {
        const alt = `Progress photo ${index + 1} from ${dateLabel}`;

        return (
          <li className={css.photo} key={photo.id}>
            {photo.url ? (
              <a href={photo.url} rel='noreferrer' target='_blank'>
                <img alt={alt} decoding='async' loading='lazy' src={photo.url} />
              </a>
            ) : (
              <div aria-label={alt} className={css.missingPhoto} role='img'>
                <ImageOffIcon aria-hidden='true' />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
