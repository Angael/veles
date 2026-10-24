import clsx from 'clsx';
import type { FoodProductCategory } from '@veles/db/seed/food-products';
import type { ReactNode } from 'react';
import { FoodCategoryIcon } from './FoodCategoryIcon';
import { NutritionInline } from './NutritionInline';
import css from './FoodSummary.module.css';

export type FoodSummaryProps = {
  action?: ReactNode;
  carbs?: number | null;
  /** Picks the placeholder icon when there is no image. */
  category?: FoodProductCategory | null;
  fat?: number | null;
  imageUrl: string | null;
  /** Without kcal the row has no nutrition and shows `meta` as a plain note instead. */
  kcal?: number;
  /** `tight` also shrinks the image and hides macros. */
  density?: 'compact' | 'default' | 'tight';
  /** Replaces the image with this icon, e.g. for recipes. */
  icon?: ReactNode;
  /** Small label under the name that tells what kind of item the row is. */
  kind?: ReactNode;
  /** Rendered on top of the image, e.g. a selection target covering the whole image. */
  mediaOverlay?: ReactNode;
  meta?: ReactNode;
  name: ReactNode;
  protein?: number | null;
};

/** Lays out a food image, identity, nutrition, and actions consistently across surfaces. */
export function FoodSummary({
  action,
  carbs,
  category = null,
  density = 'default',
  fat,
  icon,
  imageUrl,
  kcal,
  kind,
  mediaOverlay,
  meta,
  name,
  protein,
}: FoodSummaryProps) {
  return (
    <div
      className={clsx(
        css.summary,
        density !== 'default' && css.compact,
        density === 'tight' && css.tight,
      )}
    >
      <div className={clsx(css.media, icon && css.iconMedia)}>
        {icon ??
          (imageUrl ? (
            <img alt='' aria-hidden='true' className={css.image} loading='lazy' src={imageUrl} />
          ) : (
            <FoodCategoryIcon category={category} />
          ))}
        {mediaOverlay}
      </div>
      <div className={css.body}>
        <div className={css.identity}>
          <strong>{name}</strong>
          {kind ? <small className={css.kind}>{kind}</small> : null}
        </div>
        {kcal === undefined ? (
          <small className={css.note}>{meta}</small>
        ) : (
          <NutritionInline
            carbs={carbs ?? null}
            energyMeta={meta}
            fat={fat ?? null}
            hideMacros={density === 'tight'}
            kcal={kcal}
            protein={protein ?? null}
            stacked
          />
        )}
      </div>
      {action ? <div className={css.action}>{action}</div> : null}
    </div>
  );
}
