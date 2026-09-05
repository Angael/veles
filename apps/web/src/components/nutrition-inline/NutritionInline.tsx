import css from './NutritionInline.module.css';

type NutritionInlineProps = {
  carbs: number;
  energyDisplay?: 'always' | 'phone';
  fat: number;
  kcal: number;
  protein: number;
};

export function NutritionInline({
  kcal,
  protein,
  fat,
  carbs,
  energyDisplay = 'always',
}: NutritionInlineProps) {
  return (
    <div className={css.root}>
      <div className={energyDisplay === 'phone' ? css.energyPhoneOnly : css.energy}>
        <strong>{Math.round(kcal)}</strong>
        <span>kcal</span>
      </div>
      <dl className={css.macros}>
        <div className={css.macro}>
          <dt>Protein</dt>
          <dd>
            <i aria-hidden='true' className={css.dotProtein} />
            {Math.round(protein)} g
          </dd>
        </div>
        <div className={css.macro}>
          <dt>Fat</dt>
          <dd>
            <i aria-hidden='true' className={css.dotFat} />
            {Math.round(fat)} g
          </dd>
        </div>
        <div className={css.macro}>
          <dt>Carbs</dt>
          <dd>
            <i aria-hidden='true' className={css.dotCarbs} />
            {Math.round(carbs)} g
          </dd>
        </div>
      </dl>
    </div>
  );
}
