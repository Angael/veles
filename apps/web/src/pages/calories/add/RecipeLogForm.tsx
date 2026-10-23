import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { v7 as uuidv7 } from 'uuid';
import type { RecipeViewItem } from '@/pages/recipes/recipes.api';
import { useLogRecipeMutation } from '@/pages/recipes/recipes.query';
import { isLoggableIngredient, sumIngredientNutrition } from '@/pages/recipes/recipeNutrition';
import { calorieDashboardQueryOptions } from '../calories.query';
import { caloriesReturnState } from '../caloriesReturnScroll';
import { NutritionInline } from '../NutritionInline';
import { GoalPreview } from './GoalPreview';
import { RecipeIngredientChecklist } from './RecipeIngredientChecklist';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { Label } from '@/components/ui/label/Label';
import { SliderInput } from '@/components/ui/slider-input/SliderInput';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import css from './RecipeLogForm.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  initialDate: string;
  initialPortions?: number;
  recipe: RecipeViewItem;
};

/**
 * Reviews a recipe before logging: pick the eaten portions and untick ingredients that were not
 * eaten. Every ticked linked ingredient becomes its own food log; custom ones are never logged.
 */
export function RecipeLogForm({ initialDate, initialPortions, recipe }: Props) {
  const { formatNumber, t } = useI18n();
  const navigate = useNavigate();
  const logMutation = useLogRecipeMutation();
  const basePortions = Math.max(1, recipe.portions);
  const loggable = recipe.ingredients.filter(isLoggableIngredient);
  const [date, setDate] = useState(initialDate);
  const [portions, setPortions] = useState(initialPortions ?? basePortions);
  const [checkedIds, setCheckedIds] = useState(() => loggable.map((ingredient) => ingredient.id));
  // Made once, so a retried submit reuses the ids and the server skips rows it already saved.
  const [logIds] = useState(() => new Map(loggable.map((ingredient) => [ingredient.id, uuidv7()])));
  const dashboardQuery = useQuery(calorieDashboardQueryOptions(date));
  const day = dashboardQuery.data?.days.find((candidate) => candidate.date === date);
  const scale = portions / basePortions;
  const checked = loggable.filter((ingredient) => checkedIds.includes(ingredient.id));
  const total = sumIngredientNutrition(checked, scale);

  async function save() {
    if (checked.length === 0) return;
    await logMutation.mutateAsync({
      date,
      items: checked.map((ingredient) => ({
        ingredientId: ingredient.id,
        logId: logIds.get(ingredient.id) ?? uuidv7(),
      })),
      portions,
      recipeId: recipe.id,
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
      <Card as='section'>
        <TypedForm className={css.form} errorMsg={logMutation.error?.message} onSubmit={save}>
          <h1 className={css.title}>{recipe.name}</h1>
          <SliderInput
            label={t({ en: 'Portions eaten', pl: 'Zjedzone porcje' })}
            max={Math.max(8, basePortions, portions)}
            min={0.5}
            onValueChange={setPortions}
            reset={{
              label: t({
                en: `Reset to whole recipe (${formatNumber(basePortions)})`,
                pl: `Przywróć cały przepis (${formatNumber(basePortions)})`,
              }),
              value: basePortions,
            }}
            step={0.5}
            value={portions}
          />
          <RecipeIngredientChecklist
            checkedIds={checkedIds}
            ingredients={recipe.ingredients}
            onCheckedChange={(id, isChecked) =>
              setCheckedIds((current) =>
                isChecked ? [...current, id] : current.filter((checkedId) => checkedId !== id),
              )
            }
            scale={scale}
          />
          {total ? (
            <NutritionInline
              carbs={total.carbs ?? 0}
              fat={total.fat ?? 0}
              kcal={total.kcal}
              protein={total.protein ?? 0}
              stacked
            />
          ) : null}
          <FormSubmitRow>
            <Label text={t({ en: 'Date', pl: 'Data' })}>
              <DateInput name='date' onValueChange={setDate} required value={date} />
            </Label>
            <Btn disabled={checked.length === 0} loading={logMutation.isPending} type='submit'>
              {t({ en: 'Add', pl: 'Dodaj' })}
            </Btn>
          </FormSubmitRow>
        </TypedForm>
      </Card>
      <GoalPreview
        consumedKcal={Math.max(0, day?.totals.kcal ?? 0)}
        foodKcal={Math.round(total?.kcal ?? 0)}
        goalKcal={day?.goal?.kcal ?? null}
        pending={dashboardQuery.isPending}
      />
    </main>
  );
}
