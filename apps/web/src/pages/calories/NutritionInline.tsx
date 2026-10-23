import clsx from 'clsx';
import type { ReactNode } from 'react';
import css from './NutritionInline.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type NutritionInlineProps = {
  kcal: number;
  /** Untracked macros (null) show as 0. */
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  energyDisplay?: 'always' | 'phone';
  /** Shown beside kcal, e.g. the portion weight. */
  energyMeta?: ReactNode;
  /** Hides protein, fat, and carbs for kcal-only rows. */
  hideMacros?: boolean;
  stacked?: boolean;
};

export function NutritionInline({
  kcal,
  protein,
  fat,
  carbs,
  energyDisplay = 'always',
  energyMeta,
  hideMacros = false,
  stacked = false,
}: NutritionInlineProps) {
  const { formatNumber } = useI18n();

  return (
    <div className={clsx(css.root, stacked && css.stacked)}>
      <div className={energyDisplay === 'phone' ? css.energyPhoneOnly : css.energy}>
        <strong>{formatNumber(Math.round(kcal))}</strong>
        <span>kcal</span>
        {energyMeta ? <span className={css.energyMeta}>{energyMeta}</span> : null}
      </div>
      {hideMacros ? null : (
        <div className={css.macros}>
          <div className={css.macro}>
            {formatNumber(Math.round(protein ?? 0))}
            <span className={css.unit}>g</span>
          </div>
          <div className={css.macro}>
            {formatNumber(Math.round(fat ?? 0))}
            <span className={css.unit}>g</span>
          </div>
          <div className={css.macro}>
            {formatNumber(Math.round(carbs ?? 0))}
            <span className={css.unit}>g</span>
          </div>
        </div>
      )}
    </div>
  );
}
