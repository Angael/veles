import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { SelectInput } from '@/components/ui/select-input/SelectInput';
import {
  estimateMaintenanceKcal,
  macrosFromPercentages,
  type ActivityLevel,
  type FormulaSex,
  type MacroPercentages,
  type NutritionGoalValues,
} from './calorieGoalCalculator';
import css from './CalorieGoalsPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

const SEX_OPTIONS = [
  { label: { en: 'Female formula', pl: 'Wzór dla kobiet' }, value: 'female' },
  { label: { en: 'Male formula', pl: 'Wzór dla mężczyzn' }, value: 'male' },
] as const;

const ACTIVITY_OPTIONS = [
  {
    label: { en: 'Little exercise · mostly seated', pl: 'Mało ruchu · głównie siedząco' },
    value: 'sedentary',
  },
  {
    label: { en: 'Light · exercise 1–3 days/week', pl: 'Lekka · ćwiczenia 1–3 dni/tydzień' },
    value: 'light',
  },
  {
    label: {
      en: 'Moderate · exercise 3–5 days/week',
      pl: 'Umiarkowana · ćwiczenia 3–5 dni/tydzień',
    },
    value: 'moderate',
  },
  {
    label: {
      en: 'Very active · hard exercise 6–7 days/week',
      pl: 'Bardzo wysoka · intensywne ćwiczenia 6–7 dni/tydzień',
    },
    value: 'very-active',
  },
] as const;

type CalorieGoalCalculatorProps = {
  initialWeightKg: number | null;
  percentages: MacroPercentages;
  onApply: (values: NutritionGoalValues) => void;
};

/** Collects the inputs needed for a transparent maintenance-calorie estimate. */
export function CalorieGoalCalculator({
  initialWeightKg,
  onApply,
  percentages,
}: CalorieGoalCalculatorProps) {
  const { t } = useI18n();
  const sexItems = SEX_OPTIONS.map((option) => ({ ...option, label: t(option.label) }));
  const activityItems = ACTIVITY_OPTIONS.map((option) => ({ ...option, label: t(option.label) }));
  const [age, setAge] = useState<number | null>(null);
  const [sex, setSex] = useState<FormulaSex | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(initialWeightKg);
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const hasRequiredInputs =
    age !== null &&
    age >= 18 &&
    age <= 120 &&
    sex !== null &&
    weightKg !== null &&
    weightKg >= 30 &&
    weightKg <= 400 &&
    heightCm !== null &&
    heightCm >= 120 &&
    heightCm <= 250 &&
    activity !== null;

  function applyEstimate() {
    if (!hasRequiredInputs) return;

    const kcal = estimateMaintenanceKcal({ age, sex, weightKg, heightCm, activity });
    onApply(macrosFromPercentages(kcal, percentages));
  }

  return (
    <Card as='section' className={css.method}>
      <div className={css.methodHeading}>
        <h2>
          <span aria-hidden='true'>1.</span>{' '}
          {t({ en: 'Estimate maintenance calories', pl: 'Oszacuj zapotrzebowanie kaloryczne' })}
        </h2>
      </div>

      <div className={css.calculatorGrid}>
        <Label text={t({ en: 'Age', pl: 'Wiek' })}>
          <NumberInput
            max={120}
            min={18}
            onValueChange={setAge}
            placeholder={t({ en: 'Years', pl: 'Lata' })}
          />
        </Label>
        <Label text={t({ en: 'Formula sex', pl: 'Płeć we wzorze' })}>
          <SelectInput
            items={sexItems}
            onValueChange={setSex}
            placeholder={t({ en: 'Choose formula', pl: 'Wybierz wzór' })}
            value={sex}
          />
        </Label>
        <Label text={t({ en: 'Weight', pl: 'Waga' })}>
          <NumberInput max={400} min={30} onValueChange={setWeightKg} placeholder='kg' />
        </Label>
        <Label text={t({ en: 'Height', pl: 'Wzrost' })}>
          <NumberInput max={250} min={120} onValueChange={setHeightCm} placeholder='cm' />
        </Label>
        <Label
          className={css.activityField}
          text={t({ en: 'Weekly activity', pl: 'Aktywność w tygodniu' })}
        >
          <SelectInput
            items={activityItems}
            onValueChange={setActivity}
            placeholder={t({ en: 'Choose activity level', pl: 'Wybierz poziom aktywności' })}
            value={activity}
          />
        </Label>
      </div>

      <p className={css.formulaNote}>
        {t({
          en: 'The equation has only female and male variants, so this choice affects the formula only. Actual needs can vary; compare the estimate with your weight trend for a few weeks.',
          pl: 'Równanie ma tylko wariant dla kobiet i mężczyzn, więc ten wybór wpływa wyłącznie na wzór. Rzeczywiste potrzeby mogą się różnić; porównuj szacunek z trendem wagi przez kilka tygodni.',
        })}
      </p>
      <Btn
        disabled={!hasRequiredInputs}
        onClick={applyEstimate}
        type='button'
        variant='outlineMain'
      >
        {t({ en: 'Use maintenance estimate', pl: 'Użyj szacunku' })}
      </Btn>
    </Card>
  );
}
