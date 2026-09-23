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
  const remaining = goal ? goal.kcal - totals.kcal : 0;
  const energyProgress = progressFor(totals.kcal, goal?.kcal);
  const energyOverProgress =
    goal && totals.kcal > goal.kcal ? progressFor(totals.kcal - goal.kcal, goal.kcal) : null;

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
          <div className={css.energyAmounts}>
            <strong>{Math.round(totals.kcal)}</strong>
            <span>kcal consumed</span>
            {goal ? (
              <span className={css.energyGoal}>of {Math.round(goal.kcal)} kcal goal</span>
            ) : null}
          </div>
          {goal && energyProgress !== null ? (
            <div className={css.energyFooter}>
              <div aria-hidden='true' className={css.energyTrack}>
                <span className={css.energyFill} style={{ width: `${energyProgress}%` }} />
                {energyOverProgress === null ? null : (
                  <span
                    className={css.energyOverFill}
                    style={{ width: `${energyOverProgress}%` }}
                  />
                )}
              </div>
              <span className={remaining < 0 ? css.energyOver : css.energyRemaining}>
                {remaining < 0
                  ? `${Math.round(-remaining)} kcal over goal`
                  : `${Math.round(remaining)} kcal remaining`}
              </span>
            </div>
          ) : null}
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
