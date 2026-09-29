import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { calorieDashboardQueryOptions, useRecordFoodMutation } from '../calories.query';
import { SelectedFoodCard } from '../SelectedFoodCard';
import { GoalPreview } from './GoalPreview';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import css from './SelectedFoodForm.module.css';

type Props = {
  food: CalorieFood;
  initialDate: string;
};

function nutritionAtGrams(valuePer100g: number | null, grams: number) {
  return Math.round(((valuePer100g ?? 0) * grams) / 100);
}

/** Confirms a food log while keeping its nutrition preview and daily allowance in sync. */
export function SelectedFoodForm({ food, initialDate }: Props) {
  const navigate = useNavigate();
  const recordFoodMutation = useRecordFoodMutation();
  const [date, setDate] = useState(initialDate);
  const [grams, setGrams] = useState<number | null>(food.productSizeGrams ?? 100);
  const packageSizeGrams = food.productSizeGrams;
  const dashboardQuery = useQuery(calorieDashboardQueryOptions(date));
  const day = dashboardQuery.data?.days.find((candidate) => candidate.date === date);
  const selectedGrams = grams ?? 0;
  const kcal = nutritionAtGrams(food.kcalPer100g, selectedGrams);
  const protein = nutritionAtGrams(food.proteinPer100g, selectedGrams);
  const fat = nutritionAtGrams(food.fatPer100g, selectedGrams);
  const carbs = nutritionAtGrams(food.carbsPer100g, selectedGrams);
  const goalKcal = day?.goal?.kcal ?? null;
  const consumedKcal = Math.max(0, day?.totals.kcal ?? 0);

  async function save() {
    await recordFoodMutation.mutateAsync({
      date,
      grams: selectedGrams,
      productId: food.id,
    });
    await navigate({ replace: true, search: { date }, to: '/calories' });
  }

  return (
    <main className={css.page}>
      <SelectedFoodCard
        carbs={carbs}
        fat={fat}
        imageUrl={food.imageUrl}
        kcal={kcal}
        name={food.name}
        productId={food.id}
        protein={protein}
      />
      <Card as='section'>
        <TypedForm
          className={css.form}
          errorMsg={recordFoodMutation.error?.message}
          onSubmit={save}
        >
          {packageSizeGrams !== null && packageSizeGrams > 0 ? (
            <div
              aria-label='Package amount shortcuts'
              className={css.packageShortcuts}
              role='group'
            >
              <span className={css.packageLabel}>1 package ({Math.round(packageSizeGrams)} g)</span>
              <div className={css.packageButtons}>
                <Btn
                  onClick={() => setGrams(packageSizeGrams / 2)}
                  size='sm'
                  type='button'
                  variant='ghost'
                >
                  ½ package
                </Btn>
                <Btn
                  onClick={() => setGrams(packageSizeGrams)}
                  size='sm'
                  type='button'
                  variant='ghost'
                >
                  1 package
                </Btn>
                <Btn
                  onClick={() => setGrams(packageSizeGrams * 2)}
                  size='sm'
                  type='button'
                  variant='ghost'
                >
                  2 packages
                </Btn>
              </div>
            </div>
          ) : null}
          <Label text='Amount eaten (g)'>
            <NumberInput
              enterKeyHint='done'
              min={1}
              onValueChange={setGrams}
              required
              size='lg'
              value={grams}
            />
          </Label>
          <FormSubmitRow>
            <Label text='Date'>
              <DateInput name='date' onValueChange={setDate} required value={date} />
            </Label>
            <Btn disabled={selectedGrams < 1} loading={recordFoodMutation.isPending} type='submit'>
              Add to diary
            </Btn>
          </FormSubmitRow>
        </TypedForm>
      </Card>
      {/* Outside the Card: its backdrop-filter would trap the preview's phone `position: fixed`. */}
      <GoalPreview
        consumedKcal={consumedKcal}
        foodKcal={kcal}
        goalKcal={goalKcal}
        pending={dashboardQuery.isPending}
      />
    </main>
  );
}
