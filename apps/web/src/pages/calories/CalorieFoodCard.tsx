import type { ReactNode } from 'react';
import { Card } from '@/components/card/Card';
import { NutritionInline } from '@/components/nutrition-inline/NutritionInline';
import css from './CalorieFoodCard.module.css';

type CalorieFoodCardProps = {
  action?: ReactNode;
  children: ReactNode;
  gramsLabel: string;
  imageUrl: string | null;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};

/** Presents catalog products and diary entries with one consistent, image-aware summary. */
export function CalorieFoodCard({
  action,
  children,
  gramsLabel,
  imageUrl,
  kcal,
  protein,
  fat,
  carbs,
}: CalorieFoodCardProps) {
  return (
    <li className={css.item}>
      <Card as='article' className={css.card}>
        {imageUrl ? (
          <img alt='' aria-hidden='true' className={css.photoWash} loading='lazy' src={imageUrl} />
        ) : null}
        <div aria-hidden='true' className={css.energyTile}>
          <strong>{Math.round(kcal)}</strong>
          <span>kcal</span>
        </div>

        <div className={css.body}>
          <div className={css.top}>
            <div className={css.primaryAction}>{children}</div>
            <span className={css.grams}>{gramsLabel}</span>
            {action ? <div className={css.action}>{action}</div> : null}
          </div>

          <NutritionInline
            kcal={kcal}
            protein={protein}
            fat={fat}
            carbs={carbs}
            energyDisplay='phone'
          />
        </div>
      </Card>
    </li>
  );
}
