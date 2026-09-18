import clsx from 'clsx';
import { UtensilsIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { NutritionInline } from './NutritionInline';
import css from './FoodSummary.module.css';

export type FoodSummaryProps = {
  action?: ReactNode;
  carbs: number;
  fat: number;
  imageUrl: string | null;
  kcal: number;
  density?: 'compact' | 'default';
  meta?: ReactNode;
  name: ReactNode;
  protein: number;
};

/** Lays out a food image, identity, nutrition, and actions consistently across surfaces. */
export function FoodSummary({
  action,
  carbs,
  density = 'default',
  fat,
  imageUrl,
  kcal,
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
          <UtensilsIcon aria-hidden='true' />
        )}
      </div>
      <div className={css.body}>
        <div className={css.identity}>
          <strong>{name}</strong>
          {meta ? <span>{meta}</span> : null}
        </div>
        <NutritionInline carbs={carbs} fat={fat} kcal={kcal} protein={protein} stacked />
      </div>
      {action ? <div className={css.action}>{action}</div> : null}
    </div>
  );
}
