import type { CalorieFood } from '../calories.api';
import type { ImageFields } from '../calories.query';
import { Btn } from '@/components/btn/Btn';
import { KcalMacrosForm } from '@/components/kcal-macros-form/KcalMacrosForm';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { PhotoPicker, type PhotoPickerValue } from '@/components/photo-picker/PhotoPicker';
import { TextInput } from '@/components/text-input/TextInput';
import { TypedForm } from '@/components/typed-form/TypedForm';
import { TypedFormData } from '@/lib/typedFormData';
import { useState } from 'react';
import css from '../CalorieFlows.module.css';

export type FoodEditorValue = {
  barcode?: string;
  name: string;
  productSizeGrams?: number;
  kcalPer100g: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbsPer100g?: number;
} & ImageFields;

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
  const [photo, setPhoto] = useState<PhotoPickerValue>({ imageAction: 'keep' });

  async function handleSubmit(formData: TypedFormData) {
    await onSubmit({
      barcode: formData.string('barcode') || undefined,
      name: formData.string('name'),
      productSizeGrams: formData.optionalNumber('size'),
      kcalPer100g: formData.number('kcal'),
      proteinPer100g: formData.optionalNumber('protein'),
      fatPer100g: formData.optionalNumber('fat'),
      carbsPer100g: formData.optionalNumber('carbs'),
      imageAction: photo.imageAction,
      ...(photo.photo ? { photo: photo.photo } : {}),
    });
  }
  return (
    <TypedForm className={css.form} onSubmit={handleSubmit}>
      <Label text='Food name'>
        <TextInput defaultValue={food?.name ?? initialName} name='name' required />
      </Label>
      <div className={css.grid}>
        <Label text='Barcode'>
          <TextInput
            defaultValue={food?.barcode ?? initialBarcode}
            inputMode='numeric'
            name='barcode'
          />
        </Label>
        <Label text='Product size (g)'>
          <NumberInput defaultValue={food?.productSizeGrams ?? undefined} min={1} name='size' />
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
      <PhotoPicker
        allowUpload={!food?.imageUrl}
        disabled={pending}
        existingUrl={food?.imageUrl}
        onChange={setPhoto}
        value={photo}
      />
      <p>This changes the shared catalog photo for everyone.</p>
      <Btn disabled={pending} type='submit'>
        {pending ? 'Saving…' : submitLabel}
      </Btn>
    </TypedForm>
  );
}
