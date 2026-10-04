import { useRouter, type UseNavigateResult } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { UploadTileGrid } from '@/components/ui/upload-tile-grid/UploadTileGrid';
import { appendOrderedPhotos, type OrderedPhoto } from '@/lib/storage/orderedPhotos';
import { useUnsavedChangesGuard } from '@/lib/useUnsavedChangesGuard';
import type { WeightEntryPhoto } from '../weight.api';
import { useUpdateWeightEntryMutation } from '../weight.query';
import { WEIGHT_PHOTO_MAX_BYTES, WEIGHT_PHOTO_MAX_COUNT } from '../weightPhotos.api';
import css from '../WeightEntryPages.module.css';

type EditWeightEntryPageProps = {
  entry: {
    date: string;
    photos: WeightEntryPhoto[];
    weightKg: number;
  };
};

export function EditWeightEntryPage({ entry }: EditWeightEntryPageProps) {
  const router = useRouter();
  const [weightKg, setWeightKg] = useState<number | null>(entry.weightKg);
  const [photos, setPhotos] = useState<OrderedPhoto[]>(() =>
    entry.photos.map((photo) => ({ id: photo.id, kind: 'stored', url: photo.url })),
  );
  const mutation = useUpdateWeightEntryMutation();
  const { markDirty, markSaved } = useUnsavedChangesGuard();

  /** Sends the weight with the full ordered photo list; failures keep picked files for a retry. */
  async function handleSubmit(_data: unknown, navigate: UseNavigateResult<string>) {
    if (weightKg === null) {
      return;
    }

    const formData = new FormData();
    formData.append('date', entry.date);
    formData.append('weightKg', String(weightKg));
    appendOrderedPhotos(formData, photos);

    try {
      await mutation.mutateAsync({ data: formData });
    } catch {
      return;
    }

    markSaved();
    await navigate({ params: { date: entry.date }, replace: true, to: '/weight/$date' })
      .then(() => router.invalidate())
      .catch(() => undefined);
  }

  return (
    <main>
      <Card as='section'>
        <TypedForm className={css.form} errorMsg={mutation.error?.message} onSubmit={handleSubmit}>
          <time className={css.date} dateTime={entry.date}>
            {format(parseISO(entry.date), 'EEEE, MMM d, yyyy')}
          </time>
          <Label text='Weight (kg)'>
            <NumberInput
              enterKeyHint='done'
              max={300}
              min={30}
              onValueChange={(value) => {
                markDirty();
                setWeightKg(value);
              }}
              placeholder='e.g. 78.4'
              required
              size='lg'
              stepperStep={0.1}
              value={weightKg}
            />
          </Label>
          <div className={css.photos}>
            <span>Photos</span>
            <UploadTileGrid
              maxItemSize={WEIGHT_PHOTO_MAX_BYTES}
              maxItems={WEIGHT_PHOTO_MAX_COUNT}
              onPhotosChange={(nextPhotos) => {
                markDirty();
                setPhotos(nextPhotos);
              }}
              photos={photos}
            />
          </div>
          <FormSubmitRow>
            <Btn disabled={weightKg === null} loading={mutation.isPending} type='submit'>
              Save
            </Btn>
          </FormSubmitRow>
        </TypedForm>
      </Card>
    </main>
  );
}
