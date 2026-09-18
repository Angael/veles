import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card/Card';
import { NutritionInline } from './NutritionInline';
import css from './FoodSummary.module.css';

export type FoodSummaryProps = {
  action?: ReactNode;
  carbs: number;
  fat: number;
  imageUrl: string | null;
  kcal: number;
  meta?: ReactNode;
  name: ReactNode;
  protein: number;
};

/** Lays out a food image, identity, nutrition, and actions consistently across surfaces. */
export function FoodSummary({
  action,
  carbs,
  fat,
  imageUrl,
  kcal,
  meta,
  name,
  protein,
}: FoodSummaryProps) {
  return (
    <div className={css.summary}>
      {imageUrl ? (
        <img alt='' aria-hidden='true' className={css.image} loading='lazy' src={imageUrl} />
      ) : null}
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

/** Places the reusable food summary layout on a card surface. */
export function FoodSummaryCard({
  ariaLabel,
  as = 'section',
  ...props
}: FoodSummaryProps & {
  ariaLabel?: string;
  as?: 'article' | 'aside' | 'div' | 'section';
}) {
  return (
    <Card aria-label={ariaLabel} as={as} className={css.card}>
      <FoodSummary {...props} />
    </Card>
  );
}
