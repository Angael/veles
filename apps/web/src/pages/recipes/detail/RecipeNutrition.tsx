import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { PlusIcon, RotateCcwIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { SliderInput } from '@/components/ui/slider-input/SliderInput';
import type { RecipeLibraryItem } from '../recipes.api';
import { isLoggableIngredient, sumIngredientNutrition } from '../recipeNutrition';
import { AddToNoteAction } from './AddToNoteAction';
import css from './RecipeNutrition.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  onPortionsChange: (portions: number) => void;
  portions: number;
  recipe: RecipeLibraryItem;
};

/** Portion picker with the matching nutrition, and actions that use the picked amount. */
export function RecipeNutrition({ onPortionsChange, portions, recipe }: Props) {
  const { formatNumber, t } = useI18n();
  const basePortions = Math.max(1, recipe.portions);
  const scale = portions / basePortions;
  const nutrition = sumIngredientNutrition(recipe.ingredients, scale);
  const canLog = portions > 0 && recipe.ingredients.some(isLoggableIngredient);

  return (
    <section
      className={css.nutrition}
      aria-label={t({ en: 'Recipe nutrition and portions', pl: 'Wartości odżywcze i porcje' })}
    >
      <SliderInput
        className={css.portionSlider}
        label={t({ en: 'Portions', pl: 'Porcje' })}
        max={Math.max(8, basePortions)}
        min={0.5}
        onValueChange={onPortionsChange}
        step={0.5}
        value={portions}
      />
      {portions === basePortions ? null : (
        <Btn
          className={css.reset}
          icon={<RotateCcwIcon aria-hidden='true' />}
          onClick={() => onPortionsChange(basePortions)}
          size='sm'
          type='button'
          variant='ghost'
        >
          {t({
            en: `Reset to whole recipe (${formatNumber(basePortions)})`,
            pl: `Przywróć cały przepis (${formatNumber(basePortions)})`,
          })}
        </Btn>
      )}

      {nutrition ? (
        <div className={css.nutritionValues}>
          <dl>
            <NutritionItem className={css.kcal} label='Kcal' value={nutrition.kcal} />
          </dl>
          <dl className={css.macros}>
            <NutritionItem
              className={css.protein}
              label={t({ en: 'Protein', pl: 'Białko' })}
              unit='g'
              value={nutrition.protein}
            />
            <NutritionItem
              className={css.fat}
              label={t({ en: 'Fat', pl: 'Tłuszcz' })}
              unit='g'
              value={nutrition.fat}
            />
            <NutritionItem
              className={css.carb}
              label={t({ en: 'Carb', pl: 'Węglowodany' })}
              unit='g'
              value={nutrition.carbs}
            />
          </dl>
        </div>
      ) : null}

      <div className={css.actions}>
        {canLog ? (
          <Btn
            icon={<PlusIcon aria-hidden='true' />}
            isLink
            render={<Link search={{ portions, recipeId: recipe.id }} to='/calories/add' />}
          >
            {t({ en: 'Add', pl: 'Dodaj' })}
          </Btn>
        ) : null}
        <AddToNoteAction portions={portions} recipe={recipe} />
      </div>
    </section>
  );
}

function NutritionItem({
  className,
  label,
  unit = '',
  value,
}: {
  className?: string;
  label: string;
  unit?: string;
  value: number | null;
}) {
  const { formatNumber } = useI18n();

  if (value === null) {
    return null;
  }

  const formattedValue = formatNumber(Math.round(value));

  return (
    <div className={clsx(css.nutritionItem, className)}>
      <dt>{label}</dt>
      <dd>
        {formattedValue}
        {unit}
      </dd>
    </div>
  );
}
