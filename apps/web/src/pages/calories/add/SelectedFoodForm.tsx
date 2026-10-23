import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { caloriesReturnState } from '../caloriesReturnScroll';
import { useState } from 'react';
import type { CalorieFood } from '../calories.api';
import { calorieDashboardQueryOptions, useRecordFoodMutation } from '../calories.query';
import { SelectedFoodCard } from '../SelectedFoodCard';
import { foodProductNames } from '../calorieHelpers';
import { foodUnitAmountText, type FoodUnitShortcut } from '../foodUnits';
import { GoalPreview } from './GoalPreview';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { Label } from '@/components/ui/label/Label';
import { NumberInput } from '@/components/ui/number-input/NumberInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import css from './SelectedFoodForm.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  food: CalorieFood;
  initialDate: string;
};

const UNIT_SHORTCUTS: FoodUnitShortcut[] = [0.5, 1, 2];

function nutritionAtGrams(valuePer100g: number | null, grams: number) {
  return Math.round(((valuePer100g ?? 0) * grams) / 100);
}

/** Confirms a food log while keeping its nutrition preview and daily allowance in sync. */
export function SelectedFoodForm({ food, initialDate }: Props) {
  const { formatWhole, t } = useI18n();
  const navigate = useNavigate();
  const recordFoodMutation = useRecordFoodMutation();
  const [date, setDate] = useState(initialDate);
  const [grams, setGrams] = useState<number | null>(food.productSizeGrams ?? 100);
  const unitGrams = food.productSizeGrams;
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
    await navigate({
      replace: true,
      search: { date },
      state: caloriesReturnState(date),
      to: '/calories',
    });
  }

  return (
    <main className={css.page}>
      <SelectedFoodCard
        addFoodDate={date}
        carbs={carbs}
        fat={fat}
        category={food.category}
        imageUrl={food.imageUrl}
        kcal={kcal}
        name={t(foodProductNames(food))}
        productId={food.id}
        protein={protein}
      />
      <Card as='section'>
        <TypedForm
          className={css.form}
          errorMsg={recordFoodMutation.error?.message}
          onSubmit={save}
        >
          {unitGrams !== null && unitGrams > 0 ? (
            <div
              aria-label={t({ en: 'Amount shortcuts', pl: 'Skróty ilości' })}
              className={css.unitShortcuts}
              role='group'
            >
              <span className={css.unitLabel}>
                {`${t(foodUnitAmountText(food.unit, 1))} (${formatWhole(unitGrams)} g)`}
              </span>
              <div className={css.unitButtons}>
                {UNIT_SHORTCUTS.map((amount) => (
                  <Btn
                    key={amount}
                    onClick={() => setGrams(unitGrams * amount)}
                    size='sm'
                    type='button'
                    variant='ghost'
                  >
                    {t(foodUnitAmountText(food.unit, amount))}
                  </Btn>
                ))}
              </div>
            </div>
          ) : null}
          <Label text={t({ en: 'Amount eaten (g)', pl: 'Zjedzona ilość (g)' })}>
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
            <Label text={t({ en: 'Date', pl: 'Data' })}>
              <DateInput name='date' onValueChange={setDate} required value={date} />
            </Label>
            <Btn disabled={selectedGrams < 1} loading={recordFoodMutation.isPending} type='submit'>
              {t({ en: 'Add to diary', pl: 'Dodaj do dziennika' })}
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
