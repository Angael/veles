import { useRouter } from '@tanstack/react-router';
import { format } from 'date-fns';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { UploadTileGrid } from '@/components/ui/upload-tile-grid/UploadTileGrid';
import css from './WeightEntryPages.module.css';
import { useAddWeightPhotosMutation, useSaveWeightMutation } from './weight.query';
import { WEIGHT_PHOTO_MAX_BYTES, WEIGHT_PHOTO_MAX_COUNT } from './weightPhotos.api';

export function AddWeightPage() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const saveMutation = useSaveWeightMutation();
  const photosMutation = useAddWeightPhotosMutation();

  /**
   * Saves the weight first, then uploads photos separately so a failed upload keeps the saved
   * measurement and leaves the selected files in place for a retry.
   */
  async function handleSubmit() {
    if (weightKg === null) {
      return;
    }

    setError(null);

    try {
      await saveMutation.mutateAsync({ data: { date, weightKg } });
    } catch {
      return;
    }

    if (photos.length > 0) {
      const formData = new FormData();
      formData.append('date', date);

      for (const photo of photos) {
        formData.append('photos', photo);
      }

      try {
        await photosMutation.mutateAsync({ data: formData });
      } catch (uploadError) {
        const reason = uploadError instanceof Error ? uploadError.message : 'Upload failed.';
        setError(`Weight saved, but photos were not uploaded. ${reason}`);
        return;
      }
    }

    await router.invalidate().catch(() => undefined);
    await router.navigate(
      photos.length > 0
        ? { params: { date }, replace: true, to: '/weight/$date' }
        : { replace: true, to: '/weight' },
    );
  }

  return (
    <main>
      <Card as='section'>
        <TypedForm className={css.form} errorMsg={error} onSubmit={handleSubmit}>
          <Label text='Weight (kg)'>
            <NumberInput
              enterKeyHint='done'
              max={300}
              min={30}
              onValueChange={setWeightKg}
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
              files={photos}
              maxItemSize={WEIGHT_PHOTO_MAX_BYTES}
              maxItems={WEIGHT_PHOTO_MAX_COUNT}
              onFilesChange={setPhotos}
            />
          </div>
          <FormSubmitRow>
            <Label text='Date'>
              <DateInput max={today} name='date' onValueChange={setDate} required value={date} />
            </Label>
            <Btn
              disabled={!date || weightKg === null}
              loading={saveMutation.isPending || photosMutation.isPending}
              type='submit'
            >
              Add weight
            </Btn>
          </FormSubmitRow>
        </TypedForm>
      </Card>
    </main>
  );
}
