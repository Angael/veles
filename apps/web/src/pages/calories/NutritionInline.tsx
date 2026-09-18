import clsx from 'clsx';
import css from './NutritionInline.module.css';

type NutritionInlineProps = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  energyDisplay?: 'always' | 'phone';
  stacked?: boolean;
};

export function NutritionInline({
  kcal,
  protein,
  fat,
  carbs,
  energyDisplay = 'always',
  stacked = false,
}: NutritionInlineProps) {
  return (
    <div className={clsx(css.root, stacked && css.stacked)}>
      <div className={energyDisplay === 'phone' ? css.energyPhoneOnly : css.energy}>
        <strong>{Math.round(kcal)}</strong>
        <span>kcal</span>
      </div>
      <div className={css.macros}>
        <div className={css.macro}>
          {Math.round(protein)}
          <span className={css.unit}>g</span>
        </div>
        <div className={css.macro}>
          {Math.round(fat)}
          <span className={css.unit}>g</span>
        </div>
        <div className={css.macro}>
          {Math.round(carbs)}
          <span className={css.unit}>g</span>
        </div>
      </div>
    </div>
  );
}
