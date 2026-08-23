import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { calorieDashboardQueryOptions, useRecordFoodMutation } from '../calories.query';
import { formatNutritionNumber } from '../dashboard/nutritionFormat';
import { Btn } from '@/components/btn/Btn';
import { DateInput } from '@/components/date-input/DateInput';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
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
  const dashboardQuery = useQuery(calorieDashboardQueryOptions(date));
  const day = dashboardQuery.data?.days.find((candidate) => candidate.date === date);
  const selectedGrams = grams ?? 0;
  const kcal = nutritionAtGrams(food.kcalPer100g, selectedGrams);
  const protein = nutritionAtGrams(food.proteinPer100g, selectedGrams);
  const fat = nutritionAtGrams(food.fatPer100g, selectedGrams);
  const carbs = nutritionAtGrams(food.carbsPer100g, selectedGrams);
  const remaining = day?.goal ? Math.round(day.goal.kcal - day.totals.kcal) : null;

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
      <section className={css.product}>
        {food.imageUrl ? <img alt='' src={food.imageUrl} /> : null}
        <div className={css.productBody}>
          <div className={css.productHeading}>
            <div>
              <strong>{food.name}</strong>
              {food.brand ? <span>{food.brand}</span> : null}
            </div>
            <Btn
              aria-label={`Edit ${food.name}`}
              icon={<PencilIcon aria-hidden='true' />}
              iconOnly
              isLink
              render={<Link params={{ foodId: food.id }} to='/calories/foods/$foodId' />}
              size='sm'
              variant='ghost'
            />
          </div>
          <dl className={css.nutrition}>
            <div className={css.energy}>
              <dt>Calories</dt>
              <dd>{formatNutritionNumber(kcal)} kcal</dd>
            </div>
            <div className={css.protein}>
              <dt>Protein</dt>
              <dd>{formatNutritionNumber(protein)} g</dd>
            </div>
            <div className={css.fat}>
              <dt>Fat</dt>
              <dd>{formatNutritionNumber(fat)} g</dd>
            </div>
            <div className={css.carbs}>
              <dt>Carbs</dt>
              <dd>{formatNutritionNumber(carbs)} g</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className={css.panel}>
        <div className={css.fields}>
          <Label text='Amount eaten (g)'>
            <NumberInput min={1} onValueChange={setGrams} step={1} value={grams} />
          </Label>
          <Label text='Date'>
            <DateInput onValueChange={setDate} value={date} />
          </Label>
        </div>
        <p aria-live='polite' className={css.remaining}>
          {dashboardQuery.isPending
            ? 'Checking daily calories…'
            : remaining === null
              ? 'Set a calorie goal to see your daily remainder.'
              : `${formatNutritionNumber(remaining)} kcal remaining for this day`}
        </p>
        <div className={css.actions}>
          <Btn onClick={onCancel} variant='ghost'>
            {cancelLabel}
          </Btn>
          <Btn loading={recordFoodMutation.isPending} onClick={() => void save()}>
            Save
          </Btn>
        </div>
      </section>
    </main>
  );
}
