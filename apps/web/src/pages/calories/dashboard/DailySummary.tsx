import { Link } from '@tanstack/react-router';
import { GoalIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import type { CalorieGoal, CalorieTotals } from '../calories.api';
import css from './DailySummary.module.css';

type DailySummaryProps = {
  goal: CalorieGoal | null;
  totals: CalorieTotals;
};

export function DailySummary({ goal, totals }: DailySummaryProps) {
  return (
    <section aria-label='Daily nutrition summary' className={css.summary} data-appear='1'>
      <div className={css.body}>
        <div className={css.energyPanel}>
          <div className={css.energyHeader}>
            <h2>Calories</h2>
            <Btn
              className={css.goalAction}
              icon={<GoalIcon aria-hidden='true' />}
              isLink
              render={<Link to='/calories/goals' />}
              size='sm'
              variant='text'
            >
              {goal ? 'Edit goals' : 'Set goals'}
            </Btn>
          </div>
          <EnergyProgress consumed={totals.kcal} goal={goal?.kcal ?? null} />
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

/**
 * Shows consumed kcal against the goal on one meter. The track scales to whichever is larger, so
 * once the goal is passed a notch marks it and the overage fills beyond it instead of clipping.
 */
function EnergyProgress({ consumed, goal }: { consumed: number; goal: number | null }) {
  const consumedKcal = Math.round(consumed);

  if (goal === null) {
    return (
      <>
        <p className={css.energyAmount}>
          <strong>{consumedKcal}</strong>
          <span>kcal eaten</span>
        </p>
        <p className={css.energyHint}>Set a daily goal to see how much is left.</p>
      </>
    );
  }

  const goalKcal = Math.round(goal);
  const scale = Math.max(consumed, goal);
  const isOver = consumed > goal;
  const withinShare = scale > 0 ? (Math.min(consumed, goal) / scale) * 100 : 0;
  const percent = goal > 0 ? Math.round((consumed / goal) * 100) : null;
  const difference = Math.round(Math.abs(goal - consumed));

  return (
    <>
      <p className={css.energyAmount}>
        <strong>{consumedKcal}</strong>
        <span>/ {goalKcal} kcal</span>
      </p>
      <div className={css.energyMeter} data-over={isOver || undefined}>
        <div aria-hidden='true' className={css.energyTrack}>
          <span className={css.energyFill} style={{ width: `${withinShare}%` }} />
          <span
            className={css.energyOverFill}
            style={{ left: `${withinShare}%`, width: `${isOver ? 100 - withinShare : 0}%` }}
          />
          <span className={css.goalMarker} style={{ left: `${withinShare}%` }} />
        </div>
        <p className={css.energyStatus}>
          <span>
            <strong>{difference}</strong> kcal {isOver ? 'over goal' : 'left'}
          </span>
          {percent === null ? null : <span className={css.energyPercent}>{percent}%</span>}
        </p>
      </div>
    </>
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
  const overProgress =
    goal !== null && goal !== undefined && value > goal ? progressFor(value - goal, goal) : null;

  return (
    <div className={css[tone]}>
      <dt>{label}</dt>
      <dd className={css.macroValue}>
        <span className={isOverGoal ? css.macroConsumedOver : css.macroConsumed}>
          {Math.round(value)}g
        </span>
        {goal === null || goal === undefined ? null : (
          <>
            <span className={css.macroSeparator}>/</span>
            <span className={css.macroTarget}>{Math.round(goal)}g</span>
          </>
        )}
      </dd>
      {progress === null ? null : (
        <dd aria-hidden='true' className={css.macroFill} style={{ width: `${progress}%` }} />
      )}
      {overProgress === null ? null : (
        <dd
          aria-hidden='true'
          className={css.macroOverFill}
          style={{ width: `${overProgress}%` }}
        />
      )}
    </div>
  );
}

function progressFor(value: number, goal: number | null | undefined) {
  if (goal === null || goal === undefined) return null;
  if (goal <= 0) return value > 0 ? 100 : 0;
  return Math.min(Math.max((value / goal) * 100, 0), 100);
}
