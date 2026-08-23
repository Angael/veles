import { formatNutritionNumber } from '@/lib/nutritionFormat';
import css from './SelectedFoodForm.module.css';

type GoalPreviewProps = {
  consumedKcal: number;
  foodKcal: number;
  goalKcal: number | null;
  pending: boolean;
};

/** Previews how the selected food changes the day's calorie goal. */
export function GoalPreview({ consumedKcal, foodKcal, goalKcal, pending }: GoalPreviewProps) {
  if (pending) {
    return (
      <div aria-live='polite' className={css.goalPreview}>
        <p className={css.goalMessage}>Checking daily calories…</p>
      </div>
    );
  }

  if (goalKcal === null) {
    return (
      <div aria-live='polite' className={css.goalPreview}>
        <p className={css.goalMessage}>Set a calorie goal to preview this day.</p>
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
          <strong>{formatNutritionNumber(Math.round(consumedKcal))} kcal</strong> eaten
        </span>
        <span>
          <i aria-hidden='true' className={wouldExceedGoal ? css.dotAddedOver : css.dotAdded} />
          <strong>+{formatNutritionNumber(foodKcal)} kcal</strong> this food
        </span>
      </div>
      <div
        aria-label={`${formatNutritionNumber(Math.round(projectedKcal))} of ${formatNutritionNumber(Math.round(goalKcal))} kcal after adding this food${wouldExceedGoal ? ', over goal' : ''}`}
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
        {formatNutritionNumber(Math.round(projectedKcal))} kcal /{' '}
        {formatNutritionNumber(Math.round(goalKcal))} kcal
      </p>
    </div>
  );
}
