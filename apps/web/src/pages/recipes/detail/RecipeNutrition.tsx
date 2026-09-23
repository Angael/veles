import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import clsx from 'clsx';
import { SliderInput } from '@/components/ui/slider-input/SliderInput';
import type { RecipeLibraryItem } from '../recipes.api';
import css from './RecipeNutrition.module.css';

export function RecipeNutrition({ recipe }: { recipe: RecipeLibraryItem }) {
  const basePortions = Math.max(1, recipe.portions);
  const [portions, setPortions] = useState(basePortions);
  const scale = portions / basePortions;
  const nutrition = {
    carbs: scaled(recipe.carbs, scale),
    fat: scaled(recipe.fats, scale),
    kcal: scaled(recipe.kcal, scale),
    protein: scaled(recipe.protein, scale),
  };

  return (
    <section className={css.nutrition} aria-label='Recipe nutrition and portions'>
      <SliderInput
        className={css.portionSlider}
        label='Portions'
        max={Math.max(8, basePortions)}
        min={0}
        onValueChange={setPortions}
        step={0.5}
        value={portions}
      />

      <div className={css.nutritionValues}>
        <dl>
          <NutritionItem className={css.kcal} label='Kcal' value={nutrition.kcal} />
        </dl>
        <dl className={css.macros}>
          <NutritionItem
            className={css.protein}
            label='Protein'
            unit='g'
            value={nutrition.protein}
          />
          <NutritionItem className={css.fat} label='Fat' unit='g' value={nutrition.fat} />
          <NutritionItem className={css.carb} label='Carb' unit='g' value={nutrition.carbs} />
        </dl>
      </div>
      {nutrition.kcal !== null ? (
        <Btn
          isLink
          render={
            <Link
              search={{
                carbs: nutrition.carbs ?? undefined,
                fat: nutrition.fat ?? undefined,
                kcal: nutrition.kcal,
                name: `${recipe.name} (quick add)`,
                protein: nutrition.protein ?? undefined,
              }}
              to='/calories/quick-add'
            />
          }
          variant='outlineMain'
        >
          Quick add kcal
        </Btn>
      ) : null}
    </section>
  );
}

function scaled(value: number | null, scale: number) {
  return value === null ? null : value * scale;
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
  if (value === null) {
    return null;
  }

  const formattedValue = Number.isInteger(value) ? value : Number(value.toFixed(1));

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
