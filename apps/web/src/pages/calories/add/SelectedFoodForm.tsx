import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { calorieDashboardQueryOptions, useRecordFoodMutation } from '../calories.query';
import { Btn } from '@/components/btn/Btn';
import { DateInput } from '@/components/date-input/DateInput';
import { Label } from '@/components/label/Label';
import { NumberInput } from '@/components/number-input/NumberInput';
import { NutritionInline } from '@/components/nutrition-inline/NutritionInline';
import { formatNutritionNumber } from '@/lib/nutritionFormat';
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
  const goalKcal = day?.goal?.kcal ?? null;
  const consumedKcal = Math.max(0, day?.totals.kcal ?? 0);
  const projectedKcal = consumedKcal + kcal;
  const wouldExceedGoal = goalKcal !== null && projectedKcal > goalKcal;
  const consumedPercent = goalKcal === null ? 0 : Math.min(100, (consumedKcal / goalKcal) * 100);
  const addedPercent =
    goalKcal === null ? 0 : Math.min(100 - consumedPercent, (Math.max(0, kcal) / goalKcal) * 100);

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
          <NutritionInline carbs={carbs} fat={fat} kcal={kcal} protein={protein} />
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
        <div aria-live='polite' className={css.goalPreview}>
          {dashboardQuery.isPending ? (
            <p className={css.goalMessage}>Checking daily calories…</p>
          ) : goalKcal === null ? (
            <p className={css.goalMessage}>Set a calorie goal to preview this day.</p>
          ) : (
            <>
              <div className={css.goalCaption}>
                <span>
                  <i aria-hidden='true' className={css.dotConsumed} />
                  <strong>{formatNutritionNumber(Math.round(consumedKcal))}</strong> eaten
                </span>
                <span>
                  <i
                    aria-hidden='true'
                    className={wouldExceedGoal ? css.dotAddedOver : css.dotAdded}
                  />
                  <strong>+{formatNutritionNumber(kcal)}</strong> this food
                </span>
                <span className={css.goalAmount}>
                  {formatNutritionNumber(Math.round(goalKcal))} goal
                </span>
              </div>
              <div
                aria-label={`${formatNutritionNumber(Math.round(projectedKcal))} of ${formatNutritionNumber(Math.round(goalKcal))} kcal after adding this food${wouldExceedGoal ? ', over goal' : ''}`}
                aria-valuemax={goalKcal}
                aria-valuemin={0}
                aria-valuenow={Math.min(projectedKcal, goalKcal)}
                className={css.goalTrack}
                role='progressbar'
              >
                <span className={css.consumedBar} style={{ width: `${consumedPercent}%` }} />
                <span
                  className={wouldExceedGoal ? css.addedBarOver : css.addedBar}
                  style={{ width: `${addedPercent}%` }}
                />
              </div>
              <p className={wouldExceedGoal ? css.goalResultOver : css.goalResult}>
                {wouldExceedGoal
                  ? `${formatNutritionNumber(Math.round(projectedKcal - goalKcal))} kcal over goal`
                  : `${formatNutritionNumber(Math.round(goalKcal - projectedKcal))} kcal left after saving`}
              </p>
            </>
          )}
        </div>
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
