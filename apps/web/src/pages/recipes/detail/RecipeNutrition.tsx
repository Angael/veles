import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { FlameIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import type { RecipeLibraryItem } from '../recipes.api';
import { isLoggableIngredient, sumIngredientNutrition } from '../recipeNutrition';
import { RecipePortionSlider } from '../RecipePortionSlider';
import { AddToNoteAction } from './AddToNoteAction';
import css from './RecipeNutrition.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = {
  onPortionsChange: (portions: number) => void;
  portions: number;
  recipe: RecipeLibraryItem;
  /** Picked portions over the recipe's own portions. */
  scale: number;
};

/** Portion picker with the matching nutrition, and actions that use the picked amount. */
export function RecipeNutrition({ onPortionsChange, portions, recipe, scale }: Props) {
  const { t } = useI18n();
  const nutrition = sumIngredientNutrition(recipe.ingredients, scale);
  const canLog = portions > 0 && recipe.ingredients.some(isLoggableIngredient);

  return (
    <section
      className={css.nutrition}
      aria-label={t({ en: 'Recipe nutrition and portions', pl: 'Wartości odżywcze i porcje' })}
    >
      <RecipePortionSlider
        className={css.portionSlider}
        label={t({ en: 'Portions', pl: 'Porcje' })}
        onValueChange={onPortionsChange}
        recipePortions={recipe.portions}
        value={portions}
      />

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
            icon={<FlameIcon aria-hidden='true' />}
            isLink
            render={<Link search={{ portions, recipeId: recipe.id }} to='/calories/add' />}
          >
            {t({ en: 'Log calories', pl: 'Zapisz kalorie' })}
          </Btn>
        ) : null}
        <AddToNoteAction portions={portions} recipe={recipe} scale={scale} />
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
  const { formatWhole } = useI18n();

  if (value === null) {
    return null;
  }

  const formattedValue = formatWhole(value);

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
