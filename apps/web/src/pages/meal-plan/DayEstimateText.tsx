import { useI18n } from '@/lib/i18n/I18nProvider';
import { pluralEn, pluralPl } from '@/lib/i18n/locale';
import type { DayEstimate } from './mealPlanEstimate';
import css from './MealPlanPage.module.css';

/**
 * Planned kcal for a day, worded as an estimate. Meals without recipe nutrition are counted, not
 * guessed, so a partial total reads "at least" and names how many meals it leaves out.
 */
export function DayEstimateText({ estimate }: { estimate: DayEstimate }) {
  const { formatNumber, t } = useI18n();
  const kcal = formatNumber(Math.round(estimate.kcal));
  const missing = estimate.missingCount;

  if (!estimate.estimatedCount) {
    return (
      <p className={css.estimate}>{t({ en: 'No kcal estimate', pl: 'Brak szacunku kcal' })}</p>
    );
  }

  if (!missing) {
    return (
      <p className={css.estimate}>
        {t({ en: `≈ ${kcal} kcal planned`, pl: `≈ ${kcal} kcal w planie` })}
      </p>
    );
  }

  return (
    <p className={css.estimate}>
      {t({ en: `≥ ${kcal} kcal planned`, pl: `≥ ${kcal} kcal w planie` })}
      <small>
        {t({
          en: `${missing} ${pluralEn(missing, 'meal', 'meals')} without nutrition`,
          pl: `${missing} ${pluralPl(missing, 'posiłek', 'posiłki', 'posiłków')} bez wartości`,
        })}
      </small>
    </p>
  );
}
