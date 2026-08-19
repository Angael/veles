import { useId } from 'react';
import type { CalorieGoal, CalorieTotals } from '../calories.api';
import { formatNutritionNumber } from './nutritionFormat';
import css from './DailySummary.module.css';

type DailySummaryProps = {
  goal: CalorieGoal | null;
  totals: CalorieTotals;
};

export function DailySummary({ goal, totals }: DailySummaryProps) {
  const energyGradientId = useId();
  const remaining = goal ? goal.kcal - totals.kcal : null;
  const energyValue = remaining ?? totals.kcal;
  const energyProgress = progressFor(totals.kcal, goal?.kcal);
  const energyCaption = remaining === null ? 'kcal consumed' : 'kcal remaining';

  return (
    <section aria-label='Daily nutrition summary' className={css.summary}>
      <div className={css.body}>
        <div className={css.energyPanel}>
          <div
            className={remaining !== null && remaining < 0 ? css.energyDialOver : css.energyDial}
          >
            <svg aria-hidden='true' viewBox='0 0 160 160'>
              <circle className={css.dialTrack} cx='80' cy='80' pathLength='100' r='69' />
              <defs>
                <linearGradient
                  gradientUnits='userSpaceOnUse'
                  id={energyGradientId}
                  x1='24'
                  x2='136'
                  y1='136'
                  y2='24'
                >
                  <stop className={css.dialGradientStart} offset='0%' />
                  <stop className={css.dialGradientEnd} offset='100%' />
                </linearGradient>
              </defs>
              {energyProgress !== null ? (
                <circle
                  className={css.dialProgress}
                  cx='80'
                  cy='80'
                  pathLength='100'
                  r='69'
                  stroke={`url(#${energyGradientId})`}
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
    </section>
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
  const remaining = goal === null || goal === undefined ? null : goal - value;

  return (
    <div className={css[tone]}>
      <dt>{label}</dt>
      <dd className={css.macroValue}>
        {formatNutritionNumber(remaining ?? value)}
        <span> g</span>
      </dd>
      <dd className={css.macroGoal}>
        {goal === null || goal === undefined
          ? 'consumed · no target'
          : `remaining · ${formatNutritionNumber(goal)} g target`}
      </dd>
      {progress === null ? null : (
        <dd aria-hidden='true' className={css.macroFill} style={{ width: `${progress}%` }} />
      )}
    </div>
  );
}

function progressFor(value: number, goal: number | null | undefined) {
  if (goal === null || goal === undefined) return null;
  if (goal <= 0) return value > 0 ? 100 : 0;
  return Math.min(Math.max((value / goal) * 100, 0), 100);
}
