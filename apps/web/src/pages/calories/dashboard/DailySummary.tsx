import type { CalorieGoal, CalorieTotals } from '../calories.api';
import { formatNutritionNumber } from './nutritionFormat';
import { Card } from '@/components/card/Card';
import css from './DailySummary.module.css';

type DailySummaryProps = {
  goal: CalorieGoal | null;
  totals: CalorieTotals;
};

export function DailySummary({ goal, totals }: DailySummaryProps) {
  const remaining = goal ? goal.kcal - totals.kcal : null;
  const energyLabel = remaining === null ? 'Energy' : remaining >= 0 ? 'Remaining' : 'Over goal';
  const energyValue = remaining === null ? totals.kcal : Math.abs(remaining);

  return (
    <Card aria-label='Daily nutrition summary' as='section'>
      <div className={css.body}>
        <dl className={css.nutrition}>
          <Metric
            detail={
              goal
                ? `${formatNutritionNumber(totals.kcal)} / ${formatNutritionNumber(goal.kcal)} kcal`
                : 'No calorie goal'
            }
            label={energyLabel}
            tone='energy'
            unit='kcal'
            value={energyValue}
          />
          <Metric
            detail={
              goal?.protein === null || goal?.protein === undefined
                ? null
                : `of ${formatNutritionNumber(goal.protein)} g`
            }
            label='Protein'
            tone='protein'
            unit='g'
            value={totals.protein ?? 0}
          />
          <Metric
            detail={
              goal?.fat === null || goal?.fat === undefined
                ? null
                : `of ${formatNutritionNumber(goal.fat)} g`
            }
            label='Fat'
            tone='fat'
            unit='g'
            value={totals.fat ?? 0}
          />
          <Metric
            detail={
              goal?.carbs === null || goal?.carbs === undefined
                ? null
                : `of ${formatNutritionNumber(goal.carbs)} g`
            }
            label='Carbs'
            tone='carbs'
            unit='g'
            value={totals.carbs ?? 0}
          />
        </dl>
      </div>
    </Card>
  );
}

function Metric({
  detail,
  label,
  tone,
  unit,
  value,
}: {
  detail: string | null;
  label: string;
  tone: 'energy' | 'protein' | 'fat' | 'carbs';
  unit: 'kcal' | 'g';
  value: number;
}) {
  return (
    <div className={css[tone]}>
      <dt>{label}</dt>
      <dd className={css.value}>
        {formatNutritionNumber(value)}
        <span> {unit}</span>
      </dd>
      <dd className={css.detail}>{detail}</dd>
    </div>
  );
}
