import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { v7 as uuidv7 } from 'uuid';
import type { RecipeLibraryItem } from '@/pages/recipes/recipes.api';
import { useLogRecipeMutation } from '@/pages/recipes/recipes.query';
import { isLoggableIngredient, sumIngredientNutrition } from '@/pages/recipes/recipeNutrition';
import { RecipePortionSlider } from '@/pages/recipes/RecipePortionSlider';
import { calorieDashboardQueryOptions } from '../calories.query';
import { caloriesReturnState } from '../caloriesReturnScroll';
import { GoalPreview } from './GoalPreview';
import { RecipeIngredientChecklist } from './RecipeIngredientChecklist';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { DateInput } from '@/components/ui/date-input/DateInput';
import { FormSubmitRow } from '@/components/ui/form-submit-row/FormSubmitRow';
import { Label } from '@/components/ui/label/Label';
import { TypedForm } from '@/components/ui/typed-form/TypedForm';
import css from './RecipeLogForm.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  initialDate: string;
  initialPortions?: number;
  recipe: RecipeLibraryItem;
};

/**
 * Reviews a recipe before logging: pick the eaten portions and untick ingredients that were not
 * eaten. Every ticked ingredient becomes its own food log.
 */
export function RecipeLogForm({ initialDate, initialPortions, recipe }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const logMutation = useLogRecipeMutation();
  // Log ids are made once, so a retried submit reuses them.
  const [loggable] = useState(() =>
    recipe.ingredients
      .filter(isLoggableIngredient)
      .map((ingredient) => ({ ...ingredient, logId: uuidv7() })),
  );
  const [date, setDate] = useState(initialDate);
  const [portions, setPortions] = useState(initialPortions ?? recipe.portions);
  const [checkedIds, setCheckedIds] = useState(() => loggable.map((ingredient) => ingredient.id));
  const dashboardQuery = useQuery(calorieDashboardQueryOptions(date));
  const day = dashboardQuery.data?.days.find((candidate) => candidate.date === date);
  const scale = portions / recipe.portions;
  const checked = loggable.filter((ingredient) => checkedIds.includes(ingredient.id));
  const total = sumIngredientNutrition(checked, scale);

  async function save() {
    if (checked.length === 0) return;
    await logMutation.mutateAsync({
      date,
      items: checked.map(({ id, logId }) => ({ ingredientId: id, logId })),
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
          <RecipePortionSlider
            label={t({ en: 'Portions eaten', pl: 'Zjedzone porcje' })}
            onValueChange={setPortions}
            recipePortions={recipe.portions}
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
