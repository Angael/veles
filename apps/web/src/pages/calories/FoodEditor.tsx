import type { FormEvent } from 'react';
import type { CalorieFood } from './calories.api';
import { Btn } from '@/components/btn/Btn';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { TextInput } from '@/components/text-input/TextInput';
import css from './CalorieFlows.module.css';

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
    const data = new FormData(event.currentTarget);
    const optionalNumber = (name: string) => {
      const value = String(data.get(name) ?? '').trim();
      return value ? Number(value) : undefined;
    };
    await onSubmit({
      barcode: String(data.get('barcode') ?? '').trim() || undefined,
      brand: String(data.get('brand') ?? '').trim() || undefined,
      imageUrl: String(data.get('imageUrl') ?? '').trim() || undefined,
      name: String(data.get('name') ?? '').trim(),
      productSizeGrams: optionalNumber('size'),
      kcalPer100g: Number(data.get('kcal')),
      proteinPer100g: optionalNumber('protein'),
      fatPer100g: optionalNumber('fat'),
      carbsPer100g: optionalNumber('carbs'),
    });
  }
  return (
    <form className={css.form} onSubmit={(event) => void handleSubmit(event)}>
      <div className={css.grid}>
        <Label text='Product name'>
          <TextInput defaultValue={food?.name ?? initialName} name='name' required />
        </Label>
        <Label text='Brand'>
          <TextInput defaultValue={food?.brand ?? ''} name='brand' />
        </Label>
      </div>
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
            min={0.01}
            name='size'
            step={0.01}
          />
        </Label>
      </div>
      <div className={css.grid}>
        <Label text='kcal / 100 g'>
          <NumberInput
            defaultValue={food?.kcalPer100g ?? undefined}
            min={0}
            name='kcal'
            required
            step={0.01}
          />
        </Label>
        <Label text='Protein / 100 g'>
          <NumberInput
            defaultValue={food?.proteinPer100g ?? undefined}
            min={0}
            name='protein'
            step={0.01}
          />
        </Label>
        <Label text='Fat / 100 g'>
          <NumberInput
            defaultValue={food?.fatPer100g ?? undefined}
            min={0}
            name='fat'
            step={0.01}
          />
        </Label>
        <Label text='Carbs / 100 g'>
          <NumberInput
            defaultValue={food?.carbsPer100g ?? undefined}
            min={0}
            name='carbs'
            step={0.01}
          />
        </Label>
      </div>
      <Label text='Image URL'>
        <TextInput defaultValue={food?.imageUrl ?? ''} name='imageUrl' type='url' />
      </Label>
      <Btn disabled={pending} type='submit'>
        {pending ? 'Saving…' : submitLabel}
      </Btn>
    </form>
  );
}
