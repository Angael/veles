import { useRouter, type UseNavigateResult } from '@tanstack/react-router';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { useUpdateFoodLogMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { KcalMacrosForm } from '@/components/ui/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { PhotoPicker, type PhotoPickerValue } from '../PhotoPicker';
import { SelectedFoodCard } from '../SelectedFoodCard';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { TypedFormData } from '@/components/ui/typed-form/TypedFormData';
import css from '../CalorieFlows.module.css';
import { useProportionalNutrition } from './useProportionalNutrition';

export function EditFoodLogPage({ log }: { log: CalorieLog }) {
  const router = useRouter();
  const updateMutation = useUpdateFoodLogMutation();
  const isProduct = log.productId !== null;
  const isPending = updateMutation.isPending;
  const { changeGrams, changeNutrition, grams, nutrition } = useProportionalNutrition(log.grams, {
    kcal: log.kcal,
    protein: log.protein,
    fat: log.fat,
    carbs: log.carbs,
  });
  const [photo, setPhoto] = useState<PhotoPickerValue>({ imageAction: 'keep' });

  async function submit(formData: TypedFormData, _navigate: UseNavigateResult<string>) {
    const nextDate = formData.string('date');
    await updateMutation.mutateAsync({
      id: log.id,
      date: nextDate,
      previousDate: log.date,
      name: isProduct ? log.name : formData.string('name'),
      grams: grams ?? undefined,
      kcal: isProduct ? log.kcal : formData.number('kcal'),
      protein: isProduct ? (log.protein ?? undefined) : formData.optionalNumber('protein'),
      fat: isProduct ? (log.fat ?? undefined) : formData.optionalNumber('fat'),
      carbs: isProduct ? (log.carbs ?? undefined) : formData.optionalNumber('carbs'),
      ...(isProduct ? {} : { imageAction: photo.imageAction, photo: photo.photo }),
    });
    await router.invalidate();
    await _navigate({ to: '/calories', search: { date: nextDate } });
  }

  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Edit food log</h1>
        </div>
      </header>

      {isProduct && log.productId ? (
        <SelectedFoodCard
          carbs={nutrition.carbs ?? 0}
          fat={nutrition.fat ?? 0}
          imageUrl={log.imageUrl}
          kcal={nutrition.kcal ?? 0}
          name={log.name}
          productId={log.productId}
          protein={nutrition.protein ?? 0}
        />
      ) : null}

      <section className={css.panel}>
        <TypedForm className={css.form} errorMsg={updateMutation.error?.message} onSubmit={submit}>
          {!isProduct ? (
            <Label text='Name'>
              <TextInput defaultValue={log.name} name='name' required />
            </Label>
          ) : null}

          <div className={css.logFields}>
            <Label text='Date'>
              <DateInput defaultValue={log.date} name='date' required />
            </Label>

            <Label text='Amount eaten (g)'>
              <NumberInput min={0} name='grams' onValueChange={changeGrams} value={grams} />
            </Label>
          </div>

          {!isProduct ? (
            <KcalMacrosForm onValueChange={changeNutrition} values={nutrition} />
          ) : null}

          {!isProduct ? (
            <PhotoPicker
              disabled={isPending}
              existingUrl={log.imageUrl}
              onChange={setPhoto}
              value={photo}
            />
          ) : null}

          <div className={css.logActions}>
            <Btn
              disabled={isPending}
              onClick={() => router.history.back()}
              type='button'
              variant='ghost'
            >
              Cancel
            </Btn>
            <Btn disabled={isPending} loading={updateMutation.isPending} type='submit'>
              Save
            </Btn>
          </div>
        </TypedForm>
      </section>
    </main>
  );
}
