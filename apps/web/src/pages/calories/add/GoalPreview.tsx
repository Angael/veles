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
  const kcal = (value: number) => `${formatWhole(value)} kcal`;

  if (pending) {
    return (
      <div aria-live='polite' className={css.goalPreview}>
        <p className={css.goalMessage}>
          {t({ en: 'Checking daily calories…', pl: 'Sprawdzanie dziennych kalorii…' })}
        </p>
      </div>
    );
  }

  if (goalKcal === null) {
    return (
      <div aria-live='polite' className={css.goalPreview}>
        <p className={css.goalMessage}>
          {t({
            en: 'Set a calorie goal to preview this day.',
            pl: 'Ustaw cel kaloryczny, aby zobaczyć podgląd dnia.',
          })}
        </p>
      </div>
    );
  }

  const projectedKcal = consumedKcal + foodKcal;
  const wouldExceedGoal = projectedKcal > goalKcal;
  const consumedPercent = Math.min(100, (consumedKcal / goalKcal) * 100);
  const addedPercent = Math.min(100 - consumedPercent, (Math.max(0, foodKcal) / goalKcal) * 100);

  return (
    <div aria-live='polite' className={css.goalPreview}>
      <div className={css.goalCaption}>
        <span>
          <i aria-hidden='true' className={css.dotConsumed} />
          <strong>{kcal(consumedKcal)}</strong> {t({ en: 'eaten', pl: 'zjedzone' })}
        </span>
        <span>
          <i aria-hidden='true' className={wouldExceedGoal ? css.dotAddedOver : css.dotAdded} />
          <strong>+{kcal(foodKcal)}</strong> {t({ en: 'this food', pl: 'ten produkt' })}
        </span>
      </div>
      <div
        aria-label={t({
          en: `${formatWhole(projectedKcal)} of ${kcal(goalKcal)} after adding this food${wouldExceedGoal ? ', over goal' : ''}`,
          pl: `${formatWhole(projectedKcal)} z ${kcal(goalKcal)} po dodaniu tego produktu${wouldExceedGoal ? ', ponad cel' : ''}`,
        })}
        aria-valuemax={goalKcal}
        aria-valuemin={0}
        aria-valuenow={Math.min(projectedKcal, goalKcal)}
        className={css.goalTrack}
        role='progressbar'
      >
        <span className={css.consumedBar} style={{ width: `${consumedPercent}%` }} />
        <span
          className={wouldExceedGoal ? css.addedBarOver : css.addedBar}
          style={{ width: `${addedPercent}%` }}
        />
      </div>
      <p className={wouldExceedGoal ? css.goalResultOver : css.goalResult}>
        {kcal(projectedKcal)} / {kcal(goalKcal)}
      </p>
    </div>
  );
}
