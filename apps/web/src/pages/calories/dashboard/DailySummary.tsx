import { useId, useState } from 'react';
import type { CalorieGoal, CalorieTotals } from '../calories.api';
import { formatNutritionNumber } from './nutritionFormat';
import css from './DailySummary.module.css';

type DailySummaryProps = {
  goal: CalorieGoal | null;
  totals: CalorieTotals;
};

export function DailySummary({ goal, totals }: DailySummaryProps) {
  const remaining = goal ? goal.kcal - totals.kcal : null;
  const energyValue = remaining ?? totals.kcal;
  const energyProgress = progressFor(totals.kcal, goal?.kcal);
  const energyCaption = remaining === null ? 'kcal consumed' : 'kcal remaining';

  return (
    <section aria-label='Daily nutrition summary' className={css.summary} data-appear='1'>
      <div className={css.body}>
        <div className={css.energyPanel}>
          <EnergyDial
            goal={goal?.kcal}
            progress={energyProgress}
            remaining={energyValue}
            total={totals.kcal}
          />
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

function EnergyDial({
  goal,
  progress,
  remaining,
  total,
}: {
  goal: number | null | undefined;
  progress: number | null;
  remaining: number;
  total: number;
}) {
  const energyGradientId = useId();
  const [showTotals, setShowTotals] = useState(false);
  const className = remaining < 0 ? css.energyDialOver : css.energyDial;
  const content = (
    <>
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
        {progress === null ? null : (
          <circle
            className={css.dialProgress}
            cx='80'
            cy='80'
            pathLength='100'
            r='69'
            stroke={`url(#${energyGradientId})`}
            strokeDasharray='100'
            strokeDashoffset={100 - progress}
          />
        )}
      </svg>

      <div className={css.energyValue}>
        {showTotals && goal !== null && goal !== undefined ? (
          <div className={css.energyStack}>
            <strong>
              {formatNutritionNumber(total)}
              <small>kcal</small>
            </strong>
            <span>/</span>
            <strong>
              {formatNutritionNumber(goal)}
              <small>kcal</small>
            </strong>
          </div>
        ) : (
          <>
            <strong>{formatNutritionNumber(remaining)}</strong>
            <span>{goal === null || goal === undefined ? 'kcal consumed' : 'kcal remaining'}</span>
          </>
        )}
      </div>
    </>
  );

  if (goal === null || goal === undefined) return <div className={className}>{content}</div>;

  return (
    <button
      aria-label={showTotals ? 'Show calories remaining' : 'Show consumed calories and goal'}
      aria-pressed={showTotals}
      className={className}
      onClick={() => setShowTotals((current) => !current)}
      type='button'
    >
      {content}
    </button>
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
  const isOverGoal = goal !== null && goal !== undefined && value > goal;

  return (
    <div className={css[tone]}>
      <dt>{label}</dt>
      <dd className={css.macroValue}>
        <span className={isOverGoal ? css.macroConsumedOver : css.macroConsumed}>
          {formatNutritionNumber(value)}g
        </span>
        {goal === null || goal === undefined ? null : (
          <>
            <span className={css.macroSeparator}>/</span>
            <span className={css.macroTarget}>{formatNutritionNumber(goal)}g</span>
          </>
        )}
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
