import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
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

const SEX_OPTIONS = [
  { label: 'Female formula', value: 'female' },
  { label: 'Male formula', value: 'male' },
] as const;

const ACTIVITY_OPTIONS = [
  { label: 'Little exercise · mostly seated', value: 'sedentary' },
  { label: 'Light · exercise 1–3 days/week', value: 'light' },
  { label: 'Moderate · exercise 3–5 days/week', value: 'moderate' },
  { label: 'Very active · hard exercise 6–7 days/week', value: 'very-active' },
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
    <section className={css.method}>
      <div className={css.methodHeading}>
        <h2>
          <span aria-hidden='true'>1.</span> Estimate maintenance calories
        </h2>
      </div>

      <div className={css.calculatorGrid}>
        <Label text='Age'>
          <NumberInput max={120} min={18} onValueChange={setAge} placeholder='Years' />
        </Label>
        <Label text='Formula sex'>
          <SelectInput
            items={SEX_OPTIONS}
            onValueChange={setSex}
            placeholder='Choose formula'
            value={sex}
          />
        </Label>
        <Label text='Weight'>
          <NumberInput max={400} min={30} onValueChange={setWeightKg} placeholder='kg' />
        </Label>
        <Label text='Height'>
          <NumberInput max={250} min={120} onValueChange={setHeightCm} placeholder='cm' />
        </Label>
        <Label className={css.activityField} text='Weekly activity'>
          <SelectInput
            items={ACTIVITY_OPTIONS}
            onValueChange={setActivity}
            placeholder='Choose activity level'
            value={activity}
          />
        </Label>
      </div>

      <p className={css.formulaNote}>
        The equation has only female and male variants, so this choice affects the formula only.
        Actual needs can vary; compare the estimate with your weight trend for a few weeks.
      </p>
      <Btn
        disabled={!hasRequiredInputs}
        onClick={applyEstimate}
        type='button'
        variant='outlineMain'
      >
        Use maintenance estimate
      </Btn>
    </section>
  );
}
