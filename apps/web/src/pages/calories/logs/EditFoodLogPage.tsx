import { Link, useNavigate, useRouter, type UseNavigateResult } from '@tanstack/react-router';
import { useState } from 'react';
import type { CalorieLog } from '../calories.api';
import { useDeleteFoodLogMutation, useUpdateFoodLogMutation } from '../calories.query';
import { Btn } from '@/components/ui/btn/Btn';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { KcalMacrosForm } from '@/components/ui/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { NutritionInline } from '../NutritionInline';
import { PhotoPicker, type PhotoPickerValue } from '../PhotoPicker';
import { TextInput } from '@/components/ui/text-input/TextInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { TypedFormData } from '@/components/ui/typed-form/TypedFormData';
import css from '../CalorieFlows.module.css';

type NutritionField = 'kcal' | 'protein' | 'fat' | 'carbs';
type NutritionValues = Record<NutritionField, number | null>;

export function EditFoodLogPage({ log }: { log: CalorieLog }) {
  const navigate = useNavigate();
  const router = useRouter();
  const deleteMutation = useDeleteFoodLogMutation();
  const updateMutation = useUpdateFoodLogMutation();
  const isProduct = log.productId !== null;
  const isPending = updateMutation.isPending || deleteMutation.isPending;
  const [grams, setGrams] = useState(log.grams);
  const [nutrition, setNutrition] = useState<NutritionValues>({
    kcal: log.kcal,
    protein: log.protein,
    fat: log.fat,
    carbs: log.carbs,
  });
  const [photo, setPhoto] = useState<PhotoPickerValue>({ imageAction: 'keep' });
  const error = updateMutation.error?.message ?? deleteMutation.error?.message ?? '';
  async function submit(formData: TypedFormData, _navigate: UseNavigateResult<string>) {
    const nextDate = formData.string('date');
    await updateMutation.mutateAsync({
      id: log.id,
      date: nextDate,
      previousDate: log.date,
      name: formData.string('name'),
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

  /** Keeps the logged nutrition snapshot proportional when its serving quantity changes. */
  function changeGrams(nextGrams: number | null) {
    const ratio = grams !== null && grams > 0 && nextGrams !== null ? nextGrams / grams : null;
    if (ratio !== null) {
      setNutrition((values) => ({
        kcal: scaleNutrient(values.kcal, ratio),
        protein: scaleNutrient(values.protein, ratio),
        fat: scaleNutrient(values.fat, ratio),
        carbs: scaleNutrient(values.carbs, ratio),
      }));
    }
    setGrams(nextGrams);
  }

  function changeNutrition(field: NutritionField, value: number | null) {
    setNutrition((values) => ({ ...values, [field]: value }));
  }

  async function remove() {
    await deleteMutation.mutateAsync({ date: log.date, id: log.id });
    await navigate({ to: '/calories', search: { date: log.date } });
  }

  return (
    <main className={css.page}>
      <header className={css.header}>
        <div>
          <h1>Edit logged entry</h1>
          <p>
            {isProduct
              ? 'Product details are saved as a snapshot. Edit the product, then delete and add this entry again to use the new details.'
              : 'Adjust the custom calories and macros.'}
          </p>
        </div>
      </header>
      <section className={css.panel}>
        {error ? (
          <p className={css.error} role='alert'>
            {error}
          </p>
        ) : null}
        <TypedForm className={css.form} onSubmit={submit}>
          <div className={css.grid}>
            <Label text='Name'>
              <TextInput defaultValue={log.name} name='name' readOnly={isProduct} required />
            </Label>

            <Label text='Date'>
              <DateInput defaultValue={log.date} name='date' required />
            </Label>

            <Label text='Quantity (g)'>
              <NumberInput min={0} name='grams' onValueChange={changeGrams} value={grams} />
            </Label>
          </div>

          {isProduct ? (
            <NutritionInline
              kcal={nutrition.kcal ?? 0}
              protein={nutrition.protein ?? 0}
              fat={nutrition.fat ?? 0}
              carbs={nutrition.carbs ?? 0}
            />
          ) : (
            <KcalMacrosForm onValueChange={changeNutrition} values={nutrition} />
          )}
          {!isProduct ? (
            <PhotoPicker
              disabled={isPending}
              existingUrl={log.imageUrl}
              onChange={setPhoto}
              value={photo}
            />
          ) : null}

          <div className={css.actions}>
            <Btn disabled={isPending} onClick={() => void remove()} variant='ghost'>
              Delete entry
            </Btn>
            {log.productId ? (
              <Btn
                isLink
                render={<Link params={{ foodId: log.productId }} to='/calories/foods/$foodId' />}
                variant='ghost'
              >
                Edit product itself
              </Btn>
            ) : null}
            <Btn disabled={isPending} type='submit'>
              Save entry
            </Btn>
          </div>
        </TypedForm>
      </section>
    </main>
  );
}

function scaleNutrient(value: number | null, ratio: number) {
  return value === null ? null : Math.round(value * ratio * 100) / 100;
}
