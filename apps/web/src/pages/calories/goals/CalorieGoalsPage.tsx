import type { UseNavigateResult } from '@tanstack/react-router';
import { useState } from 'react';
import type { CalorieGoal } from '../calories.api';
import { useSetDailyCalorieGoalMutation } from '../calories.query';
import { todayLocalDate } from '@/lib/dateOnly';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { KcalMacrosForm } from '@/components/ui/kcal-macros-form/KcalMacrosForm';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { TypedFormData } from '@/components/ui/typed-form/TypedFormData';
import { CalorieGoalCalculator } from './CalorieGoalCalculator';
import {
  DEFAULT_MACRO_PERCENTAGES,
  macrosFromPercentages,
  percentagesFromMacros,
  type MacroPercentages,
  type NutritionGoalValues,
} from './calorieGoalCalculator';
import { MacroPercentageEditor } from './MacroPercentageEditor';
import css from './CalorieGoalsPage.module.css';

export function CalorieGoalsPage({
  goal,
  latestWeightKg,
}: {
  goal: CalorieGoal | null;
  latestWeightKg: number | null;
}) {
  const initialValues: NutritionGoalValues = {
    kcal: goal?.kcal ?? null,
    protein: goal?.protein ?? null,
    fat: goal?.fat ?? null,
    carbs: goal?.carbs ?? null,
  };
  const [values, setValues] = useState(initialValues);
  const [percentages, setPercentages] = useState(() =>
    percentagesFromMacros(initialValues, DEFAULT_MACRO_PERCENTAGES),
  );
  const goalMutation = useSetDailyCalorieGoalMutation();
  async function submit(formData: TypedFormData, navigate: UseNavigateResult<string>) {
    const date = todayLocalDate();
    await goalMutation.mutateAsync({
      date,
      kcal: formData.number('kcal'),
      protein: formData.optionalNumber('protein'),
      fat: formData.optionalNumber('fat'),
      carbs: formData.optionalNumber('carbs'),
    });
    await navigate({ replace: true, search: { date }, to: '/calories' });
  }

  function applyPercentages(nextPercentages: MacroPercentages) {
    setPercentages(nextPercentages);
    if (values.kcal !== null) setValues(macrosFromPercentages(values.kcal, nextPercentages));
  }

  function updateGoalValue(field: keyof NutritionGoalValues, value: number | null) {
    if (field === 'kcal') {
      setValues(
        value === null ? { ...values, kcal: null } : macrosFromPercentages(value, percentages),
      );
      return;
    }

    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    setPercentages(percentagesFromMacros(nextValues, percentages));
  }
  return (
    <main>
      <TypedForm className={css.sections} errorMsg={goalMutation.error?.message} onSubmit={submit}>
        <CalorieGoalCalculator
          initialWeightKg={latestWeightKg}
          onApply={setValues}
          percentages={percentages}
        />
        <MacroPercentageEditor onChange={applyPercentages} percentages={percentages} />

        <Card as='section' className={css.currentGoals} tone='primary'>
          <div className={css.currentGoalsHeading}>
            <h2>
              <span aria-hidden='true'>3.</span> Review daily targets
            </h2>
          </div>
          <KcalMacrosForm kcalInput={{ min: 1 }} onValueChange={updateGoalValue} values={values} />

          <FormSubmitRow>
            <Btn loading={goalMutation.isPending} type='submit'>
              Save
            </Btn>
          </FormSubmitRow>
        </Card>
      </TypedForm>
    </main>
  );
}
