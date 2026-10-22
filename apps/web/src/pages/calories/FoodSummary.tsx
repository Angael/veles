import clsx from 'clsx';
import type { FoodProductCategory } from '@veles/db/seed/food-products';
import type { ReactNode } from 'react';
import { FoodCategoryIcon } from './FoodCategoryIcon';
import { NutritionInline } from './NutritionInline';
import css from './FoodSummary.module.css';

export type FoodSummaryProps = {
  action?: ReactNode;
  carbs: number;
  /** Picks the placeholder icon when there is no image. */
  category?: FoodProductCategory | null;
  fat: number;
  imageUrl: string | null;
  kcal: number;
  density?: 'compact' | 'default';
  /** Rendered on top of the image, e.g. a selection target covering the whole image. */
  mediaOverlay?: ReactNode;
  meta?: ReactNode;
  name: ReactNode;
  protein: number;
};

/** Lays out a food image, identity, nutrition, and actions consistently across surfaces. */
export function FoodSummary({
  action,
  carbs,
  category = null,
  density = 'default',
  fat,
  imageUrl,
  kcal,
  mediaOverlay,
  meta,
  name,
  protein,
}: FoodSummaryProps) {
  return (
    <div className={clsx(css.summary, density === 'compact' && css.compact)}>
      <div className={css.media}>
        {imageUrl ? (
          <img alt='' aria-hidden='true' className={css.image} loading='lazy' src={imageUrl} />
        ) : (
          <FoodCategoryIcon category={category} />
        )}
        {mediaOverlay}
      </div>
      <div className={css.body}>
        <div className={css.identity}>
          <strong>{name}</strong>
        </div>
        <NutritionInline
          carbs={carbs}
          energyMeta={meta}
          fat={fat}
          kcal={kcal}
          protein={protein}
          stacked
        />
      </div>
      {action ? <div className={css.action}>{action}</div> : null}
    </div>
  );
}
