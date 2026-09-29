import type { UseNavigateResult } from '@tanstack/react-router';
import { useState } from 'react';
import { useRecordCustomCaloriesMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { KcalMacrosForm } from '@/components/ui/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/ui/label/Label';
import { PhotoPicker, type PhotoPickerValue } from '../PhotoPicker';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { TypedFormData } from '@/components/ui/typed-form/TypedFormData';
import { Card } from '@/components/ui/card/Card';
import css from '../CalorieFlows.module.css';

type QuickAddDefaultValues = {
  carbs?: number;
  fat?: number;
  kcal?: number;
  name?: string;
  protein?: number;
};

export function QuickAddPage({
  date,
  defaultValues,
}: {
  date: string;
  defaultValues?: QuickAddDefaultValues;
}) {
  const recordMutation = useRecordCustomCaloriesMutation();
  const [photo, setPhoto] = useState<PhotoPickerValue>({ imageAction: 'keep' });

  async function submit(formData: TypedFormData, navigate: UseNavigateResult<string>) {
    await recordMutation.mutateAsync({
      date,
      name: formData.string('name') || 'Quick add',
      kcal: formData.number('kcal'),
      protein: formData.optionalNumber('protein'),
      fat: formData.optionalNumber('fat'),
      carbs: formData.optionalNumber('carbs'),
      imageAction: photo.imageAction,
      ...(photo.photo ? { photo: photo.photo } : {}),
    });

    await navigate({ replace: true, search: { date }, to: '/calories' });
  }

  return (
    <main className={css.page}>
      <p className={css.lead}>Record energy now. Macros are optional.</p>
      <Card as='section' className={css.panel}>
        <TypedForm className={css.form} errorMsg={recordMutation.error?.message} onSubmit={submit}>
          <Label text='Label'>
            <TextInput defaultValue={defaultValues?.name ?? 'Quick add'} name='name' required />
          </Label>

          <KcalMacrosForm
            defaultValues={{
              carbs: defaultValues?.carbs,
              fat: defaultValues?.fat,
              kcal: defaultValues?.kcal,
              protein: defaultValues?.protein,
            }}
          />
          <PhotoPicker disabled={recordMutation.isPending} onChange={setPhoto} value={photo} />

          <Btn loading={recordMutation.isPending} type='submit'>
            Add to diary
          </Btn>
        </TypedForm>
      </Card>
    </main>
  );
}
