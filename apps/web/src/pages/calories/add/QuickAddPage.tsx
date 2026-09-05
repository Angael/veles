import type { UseNavigateResult } from '@tanstack/react-router';
import { useState } from 'react';
import { useRecordCustomCaloriesMutation } from '../calories.query';
import { Btn } from '@/components/btn/Btn';
import { KcalMacrosForm } from '@/components/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/label/Label';
import { PhotoPicker, type PhotoPickerValue } from '@/components/photo-picker/PhotoPicker';
import { TextInput } from '@/components/text-input/TextInput';
import { TypedForm } from '@/components/typed-form/TypedForm';
import { TypedFormData } from '@/lib/typedFormData';
import css from '../CalorieFlows.module.css';
export function QuickAddPage({ date }: { date: string }) {
  const recordMutation = useRecordCustomCaloriesMutation();
  const [photo, setPhoto] = useState<PhotoPickerValue>({ imageAction: 'keep' });
  const error = recordMutation.error?.message ?? '';

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

    await navigate({ to: '/calories', search: { date } });
  }

  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Quick add</h1>
          <p>Record energy now. Macros are optional.</p>
        </div>
      </header>
      <section className={css.panel}>
        {error ? (
          <p className={css.error} role='alert'>
            {error}
          </p>
        ) : null}
        <TypedForm className={css.form} onSubmit={submit}>
          <Label text='Label'>
            <TextInput defaultValue='Quick add' name='name' required />
          </Label>

          <KcalMacrosForm />
          <PhotoPicker disabled={recordMutation.isPending} onChange={setPhoto} value={photo} />

          <Btn loading={recordMutation.isPending} type='submit'>
            Add to diary
          </Btn>
        </TypedForm>
      </section>
    </main>
  );
}
