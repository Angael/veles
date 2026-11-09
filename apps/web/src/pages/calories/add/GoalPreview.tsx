import css from './SelectedFoodForm.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type GoalPreviewProps = {
  consumedKcal: number;
  foodKcal: number;
  goalKcal: number | null;
  pending: boolean;
};

/** Previews how the selected food changes the day's calorie goal. */
export function GoalPreview({ consumedKcal, foodKcal, goalKcal, pending }: GoalPreviewProps) {
  const { formatWhole, t } = useI18n();

  if (pending || goalKcal === null) {
    return (
      <p aria-live='polite' className={css.goalMessage}>
        {pending
          ? t({ en: 'Checking daily calories…', pl: 'Sprawdzanie dziennych kalorii…' })
          : t({
              en: 'Set a calorie goal to preview this day.',
              pl: 'Ustaw cel kaloryczny, aby zobaczyć podgląd dnia.',
            })}
      </p>
    );
  }

  const addedKcal = Math.max(0, foodKcal);
  const projectedKcal = consumedKcal + addedKcal;
  const wouldExceedGoal = projectedKcal > goalKcal;
  const consumedPercent = Math.min(100, (consumedKcal / goalKcal) * 100);
  const addedPercent = Math.min(100 - consumedPercent, (addedKcal / goalKcal) * 100);

  return (
    <div aria-live='polite' className={css.goalPreview}>
      <div
        aria-label={t({
          en: `${formatWhole(projectedKcal)} of ${formatWhole(goalKcal)} kcal after adding this food`,
          pl: `${formatWhole(projectedKcal)} z ${formatWhole(goalKcal)} kcal po dodaniu tego produktu`,
        })}
        aria-valuemax={goalKcal}
        aria-valuemin={0}
        aria-valuenow={Math.min(projectedKcal, goalKcal)}
        className={css.goalTrack}
        role='progressbar'
      >
        <span className={css.consumedBar} style={{ width: `${consumedPercent}%` }} />
        <span className={css.addedBar} style={{ width: `${addedPercent}%` }} />
      </div>
      <p aria-hidden='true' className={css.goalEquation}>
        <span>{formatWhole(consumedKcal)} kcal</span>
        {' + '}
        <span className={css.addedText}>{formatWhole(addedKcal)} kcal</span>
        {' = '}
        <span className={wouldExceedGoal ? css.sumTextOver : css.sumText}>
          {formatWhole(projectedKcal)} kcal
        </span>
        {' / '}
        <span>{formatWhole(goalKcal)} kcal</span>
      </p>
    </div>
  );
}
