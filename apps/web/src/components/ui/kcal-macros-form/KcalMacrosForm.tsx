import type { ComponentProps } from 'react';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import css from './KcalMacrosForm.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type NutritionField = 'kcal' | 'protein' | 'fat' | 'carbs';
type NutritionValues = Partial<Record<NutritionField, number | null>>;
type KcalInputProps = Pick<ComponentProps<typeof NumberInput>, 'min'>;

type KcalMacrosFormProps = {
  defaultValues?: NutritionValues;
  fatName?: 'fat' | 'fats';
  isPer100?: boolean;
  kcalRequired?: boolean;
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
  kcalRequired = true,
  kcalInput,
  onValueChange,
  readOnly,
  values,
}: KcalMacrosFormProps) {
  const { t } = useI18n();
  const inputProps = (field: NutritionField) => ({
    ...(values ? { value: values[field] } : { defaultValue: defaultValues?.[field] ?? undefined }),
    min: field === 'kcal' ? (kcalInput?.min ?? 0) : 0,
    name: field === 'fat' ? fatName : field,
    onValueChange: onValueChange
      ? (value: number | null) => onValueChange(field, value)
      : undefined,
    readOnly,
    required: field === 'kcal' && kcalRequired,
    ...(field === 'kcal' ? kcalInput : {}),
  });

  return (
    <div className={css.fields}>
      <Label text={isPer100 ? 'kcal / 100 g' : 'kcal'}>
        <NumberInput {...inputProps('kcal')} />
      </Label>
      <Label
        text={t(
          isPer100
            ? { en: 'Protein / 100 g', pl: 'Białko / 100 g' }
            : { en: 'Protein (g)', pl: 'Białko (g)' },
        )}
      >
        <NumberInput {...inputProps('protein')} />
      </Label>
      <Label
        text={t(
          isPer100
            ? { en: 'Fat / 100 g', pl: 'Tłuszcz / 100 g' }
            : { en: 'Fat (g)', pl: 'Tłuszcz (g)' },
        )}
      >
        <NumberInput {...inputProps('fat')} />
      </Label>
      <Label
        text={t(
          isPer100
            ? { en: 'Carbs / 100 g', pl: 'Węglowodany / 100 g' }
            : { en: 'Carbs (g)', pl: 'Węglowodany (g)' },
        )}
      >
        <NumberInput {...inputProps('carbs')} />
      </Label>
    </div>
  );
}
