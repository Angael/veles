import type { HomeFeatureId } from './homeFeatures';
import css from './HomePage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { MACRO_LABELS } from '@/lib/nutritionLabels';

/** Decorative sample data for the logged-out feature cards; features without one render nothing. */
export function HomeFeaturePreview({ feature }: { feature: HomeFeatureId }) {
  const { formatNumber, t } = useI18n();

  switch (feature) {
    case 'food':
      return (
        <div aria-hidden='true' className={css.foodPreview}>
          <p className={css.kcal}>
            <strong>{formatNumber(2180)}</strong> kcal
          </p>
          <dl className={css.macros}>
            <div>
              <dt>{t(MACRO_LABELS.protein)}</dt>
              <dd>148g</dd>
            </div>
            <div>
              <dt>{t(MACRO_LABELS.fat)}</dt>
              <dd>72g</dd>
            </div>
            <div>
              <dt>{t(MACRO_LABELS.carbs)}</dt>
              <dd>224g</dd>
            </div>
          </dl>
        </div>
      );
    case 'weight':
      return (
        <div aria-hidden='true' className={css.trend}>
          <span className={css.trendValue}>{formatNumber(72.4)}</span>
          <span className={css.trendUnit}>kg</span>
          <svg preserveAspectRatio='none' viewBox='0 0 180 54'>
            <path d='M2 42 C28 35, 38 45, 61 31 S102 35, 123 20 S153 22, 178 8' />
          </svg>
        </div>
      );
    case 'workouts':
      return (
        <div aria-hidden='true' className={css.setSequence}>
          <span>{t({ en: 'WARM', pl: 'ROZGRZEWKA' })}</span>
          <i />
          <span>{t({ en: 'WORK', pl: 'SERIE' })}</span>
          <i />
          <span>{t({ en: 'LOG', pl: 'POSTĘP' })}</span>
        </div>
      );
    case 'mealPlan':
      return (
        <ol aria-hidden='true' className={css.planPreview}>
          <li>
            <span>{t({ en: 'Mon', pl: 'Pon' })}</span>
            {t({ en: 'Chicken curry', pl: 'Curry z kurczakiem' })}
          </li>
          <li>
            <span>{t({ en: 'Tue', pl: 'Wt' })}</span>
            {t({ en: 'Lentil soup', pl: 'Zupa z soczewicy' })}
          </li>
          <li>
            <span>{t({ en: 'Wed', pl: 'Śr' })}</span>
            {t({ en: 'Salmon bowl', pl: 'Miska z łososiem' })}
          </li>
        </ol>
      );
    case 'recipes':
    case 'notes':
    case 'diary':
    case 'friends':
    case 'agent':
      return null;
  }
}
