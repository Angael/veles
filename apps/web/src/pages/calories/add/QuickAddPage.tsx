import type { UseNavigateResult } from '@tanstack/react-router';
import { useState } from 'react';
import { useRecordCustomCaloriesMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { KcalMacrosForm } from '@/components/ui/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/ui/label/Label';
import { PhotoPicker, type PhotoPickerValue } from '../PhotoPicker';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { TypedFormData } from '@/components/ui/typed-form/TypedFormData';
import css from '../CalorieFlows.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

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
  const { t } = useI18n();
  const recordMutation = useRecordCustomCaloriesMutation();
  const quickAddName = t({ en: 'Quick add', pl: 'Szybkie dodanie' });
  const [photo, setPhoto] = useState<PhotoPickerValue>({ imageAction: 'keep' });

  async function submit(formData: TypedFormData, navigate: UseNavigateResult<string>) {
    const logDate = formData.string('date');
    await recordMutation.mutateAsync({
      date: logDate,
      name: formData.string('name') || quickAddName,
      kcal: formData.number('kcal'),
      protein: formData.optionalNumber('protein'),
      fat: formData.optionalNumber('fat'),
      carbs: formData.optionalNumber('carbs'),
      imageAction: photo.imageAction,
      ...(photo.photo ? { photo: photo.photo } : {}),
    });

    await navigate({ replace: true, search: { date: logDate }, to: '/calories' });
  }

  return (
    <main>
      <Card as='section'>
        <TypedForm className={css.form} errorMsg={recordMutation.error?.message} onSubmit={submit}>
          <Label text={t({ en: 'Label', pl: 'Nazwa' })}>
            <TextInput defaultValue={defaultValues?.name ?? quickAddName} name='name' required />
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

          <FormSubmitRow>
            <Label text={t({ en: 'Date', pl: 'Data' })}>
              <DateInput defaultValue={date} name='date' required />
            </Label>
            <Btn loading={recordMutation.isPending} type='submit'>
              {t({ en: 'Add to diary', pl: 'Dodaj do dziennika' })}
            </Btn>
          </FormSubmitRow>
        </TypedForm>
      </Card>
    </main>
  );
}
