import type { FormEvent } from 'react';
import type { CalorieFood } from '../calories.api';
import { Btn } from '@/components/btn/Btn';
import { KcalMacrosForm } from '@/components/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import { TypedFormData } from '@/lib/formData';
import css from '../CalorieFlows.module.css';

export type FoodEditorValue = {
  barcode?: string;
  brand?: string;
  imageUrl?: string;
  name: string;
  productSizeGrams?: number;
  kcalPer100g: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
};

type Props = {
  food?: CalorieFood;
  initialBarcode?: string;
  initialName?: string;
  pending: boolean;
  submitLabel: string;
  onSubmit: (value: FoodEditorValue) => Promise<void>;
};

export function FoodEditor({
  food,
  initialBarcode,
  initialName,
  onSubmit,
  pending,
  submitLabel,
}: Props) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new TypedFormData(event.currentTarget);
    await onSubmit({
      barcode: formData.string('barcode') || undefined,
      brand: formData.string('brand') || undefined,
      imageUrl: formData.string('imageUrl') || undefined,
      name: formData.string('name'),
      productSizeGrams: formData.optionalNumber('size'),
      kcalPer100g: formData.number('kcal'),
      proteinPer100g: formData.optionalNumber('protein'),
      fatPer100g: formData.optionalNumber('fat'),
      carbsPer100g: formData.optionalNumber('carbs'),
    });
  }
  return (
    <form className={css.form} onSubmit={(event) => void handleSubmit(event)}>
      {food ? (
        <div className={css.grid}>
          <Label text='Product name'>
            <TextInput defaultValue={food.name} name='name' required />
          </Label>
          <Label text='Brand'>
            <TextInput defaultValue={food.brand ?? ''} name='brand' />
          </Label>
        </div>
      ) : (
        <Label text='Product name'>
          <TextInput defaultValue={initialName} name='name' required />
        </Label>
      )}
      <div className={css.grid}>
        <Label text='Barcode'>
          <TextInput
            defaultValue={food?.barcode ?? initialBarcode}
            inputMode='numeric'
            name='barcode'
          />
        </Label>
        <Label text='Product size (g)'>
          <NumberInput
            defaultValue={food?.productSizeGrams ?? undefined}
            min={1}
            name='size'
            step={1}
          />
        </Label>
      </div>
      <KcalMacrosForm
        defaultValues={{
          kcal: food?.kcalPer100g,
          protein: food?.proteinPer100g,
          fat: food?.fatPer100g,
          carbs: food?.carbsPer100g,
        }}
        isPer100
      />
      <Label text='Image URL'>
        <TextInput defaultValue={food?.imageUrl ?? ''} name='imageUrl' type='url' />
      </Label>
      <Btn disabled={pending} type='submit'>
        {pending ? 'Saving…' : submitLabel}
      </Btn>
    </form>
  );
}
