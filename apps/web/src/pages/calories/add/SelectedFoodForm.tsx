import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { calorieDashboardQueryOptions, useRecordFoodMutation } from '../calories.query';
import { FoodSummary } from '../FoodSummary';
import { GoalPreview } from './GoalPreview';
import { Btn } from '@/components/ui/btn/Btn';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { Label } from '@/components/ui/label/Label';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import css from './SelectedFoodForm.module.css';

type Props = {
  cancelLabel: string;
  food: CalorieFood;
  initialDate: string;
  onCancel: () => void;
};

function nutritionAtGrams(valuePer100g: number | null, grams: number) {
  return Math.round(((valuePer100g ?? 0) * grams) / 100);
}

/** Confirms a food log while keeping its nutrition preview and daily allowance in sync. */
export function SelectedFoodForm({ cancelLabel, food, initialDate, onCancel }: Props) {
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
    await navigate({ to: '/calories', search: { date } });
  }

  return (
    <main className={css.page}>
      <div className={css.backAction}>
        <Btn
          icon={<ArrowLeftIcon aria-hidden='true' />}
          onClick={onCancel}
          type='button'
          variant='ghost'
        >
          {cancelLabel}
        </Btn>
      </div>
      <TypedForm className={css.panel} errorMsg={recordFoodMutation.error?.message} onSubmit={save}>
        <div className={css.fields}>
          <Label text='Date'>
            <DateInput onValueChange={setDate} value={date} />
          </Label>
          <FoodSummary
            action={
              <Btn
                aria-label={`Edit ${food.name}`}
                icon={<PencilIcon aria-hidden='true' />}
                iconOnly
                isLink
                render={<Link params={{ foodId: food.id }} to='/calories/foods/$foodId' />}
                size='sm'
                variant='ghost'
              />
            }
            carbs={carbs}
            fat={fat}
            imageUrl={food.imageUrl}
            kcal={kcal}
            name={food.name}
            protein={protein}
          />
          <div className={css.amountField}>
            {packageSizeGrams !== null && packageSizeGrams > 0 ? (
              <div
                aria-label='Package amount shortcuts'
                className={css.packageShortcuts}
                role='group'
              >
                <span className={css.packageLabel}>
                  1 package ({Math.round(packageSizeGrams)} g)
                </span>
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
            <div className={css.amountEntry}>
              <Label text='Amount eaten (g)'>
                <NumberInput
                  enterKeyHint='done'
                  min={1}
                  required
                  onValueChange={setGrams}
                  value={grams}
                />
              </Label>
              <Btn
                disabled={selectedGrams < 1}
                loading={recordFoodMutation.isPending}
                type='submit'
              >
                Save
              </Btn>
            </div>
          </div>
        </div>
        <GoalPreview
          consumedKcal={consumedKcal}
          foodKcal={kcal}
          goalKcal={goalKcal}
          pending={dashboardQuery.isPending}
        />
      </TypedForm>
    </main>
  );
}
