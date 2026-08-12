import type { FormEvent } from 'react';
import type { CalorieFood } from './calories.api';
import { Btn } from '@/components/btn/Btn';
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
        <Field defaultValue={food?.name ?? initialName} label='Product name' name='name' required />
        <Field defaultValue={food?.brand ?? ''} label='Brand' name='brand' />
      </div>
      <div className={css.grid}>
        <Field
          defaultValue={food?.barcode ?? initialBarcode}
          inputMode='numeric'
          label='Barcode'
          name='barcode'
        />
        <Field
          defaultValue={food?.productSizeGrams ?? ''}
          label='Product size (g)'
          min='0.01'
          name='size'
          step='0.01'
          type='number'
        />
      </div>
      <div className={css.grid}>
        <Field
          defaultValue={food?.kcalPer100g ?? ''}
          label='kcal / 100 g'
          min='0'
          name='kcal'
          required
          step='0.01'
          type='number'
        />
        <Field
          defaultValue={food?.proteinPer100g ?? ''}
          label='Protein / 100 g'
          min='0'
          name='protein'
          step='0.01'
          type='number'
        />
        <Field
          defaultValue={food?.fatPer100g ?? ''}
          label='Fat / 100 g'
          min='0'
          name='fat'
          step='0.01'
          type='number'
        />
        <Field
          defaultValue={food?.carbsPer100g ?? ''}
          label='Carbs / 100 g'
          min='0'
          name='carbs'
          step='0.01'
          type='number'
        />
      </div>
      <Field defaultValue={food?.imageUrl ?? ''} label='Image URL' name='imageUrl' type='url' />
      <Btn disabled={pending} type='submit'>
        {pending ? 'Saving…' : submitLabel}
      </Btn>
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label className={css.field}>
      <span>{label}</span>
      <input {...inputProps} />
    </label>
  );
}
