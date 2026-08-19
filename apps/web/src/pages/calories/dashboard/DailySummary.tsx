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
  const energyValue = remaining === null ? totals.kcal : Math.abs(remaining);
  const energyProgress = progressFor(totals.kcal, goal?.kcal);
  const energyCaption =
    remaining === null ? 'kcal consumed' : remaining >= 0 ? 'kcal remaining' : 'kcal over goal';
  const summary =
    remaining === null
      ? 'Your energy and macro totals at a glance.'
      : remaining >= 0
        ? `You’ve used ${formatNutritionNumber(energyProgress ?? 0)}% of your calorie goal.`
        : `You’re ${formatNutritionNumber(Math.abs(remaining))} kcal beyond your calorie goal.`;

  return (
    <Card aria-label='Daily nutrition summary' as='section' className={css.summary}>
      <header className={css.header}>
        <div>
          <h2>Daily balance</h2>
          <p>{summary}</p>
        </div>
        {goal ? (
          <span className={css.goalBadge}>{formatNutritionNumber(energyProgress ?? 0)}% used</span>
        ) : null}
      </header>

      <div className={css.body}>
        <div className={css.energyPanel}>
          <div
            className={remaining !== null && remaining < 0 ? css.energyDialOver : css.energyDial}
          >
            <svg aria-hidden='true' viewBox='0 0 160 160'>
              <circle className={css.dialTrack} cx='80' cy='80' pathLength='100' r='69' />
              {energyProgress !== null ? (
                <circle
                  className={css.dialProgress}
                  cx='80'
                  cy='80'
                  pathLength='100'
                  r='69'
                  strokeDasharray='100'
                  strokeDashoffset={100 - energyProgress}
                />
              ) : null}
            </svg>
            <div className={css.energyValue}>
              <strong>{formatNutritionNumber(energyValue)}</strong>
              <span>{energyCaption}</span>
            </div>
          </div>

          <dl className={css.energyFacts}>
            <div>
              <dt>Consumed</dt>
              <dd>{formatNutritionNumber(totals.kcal)} kcal</dd>
            </div>
            <div>
              <dt>Daily goal</dt>
              <dd>{goal ? `${formatNutritionNumber(goal.kcal)} kcal` : 'Not set'}</dd>
            </div>
          </dl>
        </div>

        <dl className={css.macros}>
          <Macro goal={goal?.protein} label='Protein' tone='protein' value={totals.protein ?? 0} />
          <Macro goal={goal?.fat} label='Fat' tone='fat' value={totals.fat ?? 0} />
          <Macro goal={goal?.carbs} label='Carbs' tone='carbs' value={totals.carbs ?? 0} />
        </dl>
      </div>
    </Card>
  );
}

function Macro({
  goal,
  label,
  tone,
  value,
}: {
  goal: number | null | undefined;
  label: string;
  tone: 'protein' | 'fat' | 'carbs';
  value: number;
}) {
  const progress = progressFor(value, goal);

  return (
    <div className={css[tone]}>
      <dt>{label}</dt>
      <dd className={css.macroValue}>
        {formatNutritionNumber(value)}
        <span> g</span>
      </dd>
      <dd className={css.macroGoal}>
        {goal === null || goal === undefined
          ? 'No target'
          : `${formatNutritionNumber(goal)} g target`}
      </dd>
      <dd aria-hidden='true' className={css.macroTrack}>
        {progress === null ? null : <span style={{ width: `${progress}%` }} />}
      </dd>
    </div>
  );
}

function progressFor(value: number, goal: number | null | undefined) {
  if (goal === null || goal === undefined) return null;
  if (goal <= 0) return value > 0 ? 100 : 0;
  return Math.min(Math.max((value / goal) * 100, 0), 100);
}
