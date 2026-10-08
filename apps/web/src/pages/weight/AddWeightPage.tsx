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
import type { TypedFormData } from '@/components/ui/typed-form/TypedFormData';
import { PHOTOS_FORM_FIELD } from '@/lib/storage/imageLimits';
import { PhotosField } from '@/components/ui/photos-field/PhotosField';
import css from './WeightEntryPages.module.css';
import { useAddWeightEntryMutation } from './weight.query';
import { WEIGHT_PHOTO_MAX_COUNT } from './weightPhotos.api';

export function AddWeightPage() {
  const router = useRouter();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const mutation = useAddWeightEntryMutation();

  /** Saves the weight and photos in one request; failures keep picked files for a retry. */
  async function handleSubmit(data: TypedFormData) {
    if (weightKg === null) {
      return;
    }

    const formData = data.raw();
    formData.set('weightKg', String(weightKg));

    try {
      await mutation.mutateAsync({ data: formData });
    } catch {
      return;
    }

    await router.invalidate().catch(() => undefined);
    await router.navigate(
      formData.has(PHOTOS_FORM_FIELD)
        ? { params: { date }, replace: true, to: '/weight/$date' }
        : { replace: true, to: '/weight' },
    );
  }

  return (
    <main>
      <Card as='section'>
        <TypedForm className={css.form} errorMsg={mutation.error?.message} onSubmit={handleSubmit}>
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
          <PhotosField maxCount={WEIGHT_PHOTO_MAX_COUNT} />
          <FormSubmitRow>
            <Label text='Date'>
              <DateInput max={today} name='date' onValueChange={setDate} required value={date} />
            </Label>
            <Btn disabled={!date || weightKg === null} loading={mutation.isPending} type='submit'>
              Add weight
            </Btn>
          </FormSubmitRow>
        </TypedForm>
      </Card>
    </main>
  );
}
