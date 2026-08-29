import type { ComponentProps } from 'react';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import css from './KcalMacrosForm.module.css';

type NutritionField = 'kcal' | 'protein' | 'fat' | 'carbs';
type NutritionValues = Partial<Record<NutritionField, number | null>>;
type KcalInputProps = Pick<ComponentProps<typeof NumberInput>, 'min' | 'step'>;

type KcalMacrosFormProps = {
  defaultValues?: NutritionValues;
  fatName?: 'fat' | 'fats';
  isPer100?: boolean;
  kcalInput?: KcalInputProps;
  onValueChange?: (field: NutritionField, value: number | null) => void;
  readOnly?: boolean;
  values?: NutritionValues;
};

/** Renders the app's canonical kcal, protein, fat, and carbs input group. */
export function KcalMacrosForm({
  defaultValues,
  fatName = 'fat',
  isPer100 = false,
  kcalInput,
  onValueChange,
  readOnly,
  values,
}: KcalMacrosFormProps) {
  const inputProps = (field: NutritionField) => ({
    ...(values ? { value: values[field] } : { defaultValue: defaultValues?.[field] ?? undefined }),
    min: field === 'kcal' ? (kcalInput?.min ?? 0) : 0,
    name: field === 'fat' ? fatName : field,
    onValueChange: onValueChange
      ? (value: number | null) => onValueChange(field, value)
      : undefined,
    readOnly,
    required: field === 'kcal',
    ...(field === 'kcal' ? kcalInput : {}),
  });

  return (
    <div className={css.fields}>
      <Label text={isPer100 ? 'kcal / 100 g' : 'kcal'}>
        <NumberInput {...inputProps('kcal')} />
      </Label>
      <Label text={isPer100 ? 'Protein / 100 g' : 'Protein (g)'}>
        <NumberInput {...inputProps('protein')} />
      </Label>
      <Label text={isPer100 ? 'Fat / 100 g' : 'Fat (g)'}>
        <NumberInput {...inputProps('fat')} />
      </Label>
      <Label text={isPer100 ? 'Carbs / 100 g' : 'Carbs (g)'}>
        <NumberInput {...inputProps('carbs')} />
      </Label>
    </div>
  );
}
