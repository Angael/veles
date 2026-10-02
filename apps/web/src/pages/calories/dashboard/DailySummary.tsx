import { Link } from '@tanstack/react-router';
import { GoalIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { CountUp } from '@/components/ui/count-up/CountUp';
import type { CalorieGoal, CalorieTotals } from '../calories.api';
import css from './DailySummary.module.css';

type DailySummaryProps = {
  goal: CalorieGoal | null;
  totals: CalorieTotals;
};

export function DailySummary({ goal, totals }: DailySummaryProps) {
  return (
    <Card
      aria-label='Daily nutrition summary'
      as='section'
      className={css.summary}
      data-appear='1'
      tone='accent'
    >
      <div className={css.energy}>
        <div className={css.energyTop}>
          <p className={css.energyAmount}>
            <strong>
              <CountUp value={Math.round(totals.kcal)} />
            </strong>
            <span>{goal ? `/ ${Math.round(goal.kcal)} kcal` : 'kcal eaten'}</span>
          </p>
          <Btn
            aria-label={goal ? 'Edit goals' : undefined}
            className={css.goalAction}
            icon={<GoalIcon aria-hidden='true' />}
            iconOnly={Boolean(goal)}
            isLink
            radius='pill'
            render={<Link to='/calories/goals' />}
            size='sm'
            variant='ghost'
          >
            {goal ? null : 'Set goals'}
          </Btn>
        </div>
        {goal ? (
          <>
            <Meter goal={goal.kcal} size='lg' value={totals.kcal} />
            <EnergyStatus consumed={totals.kcal} goal={goal.kcal} />
          </>
        ) : (
          <p className={css.energyHint}>Set a daily goal to see how much is left.</p>
        )}
      </div>

      <dl className={css.macros}>
        <Macro goal={goal?.protein} label='Protein' tone='protein' value={totals.protein ?? 0} />
        <Macro goal={goal?.fat} label='Fat' tone='fat' value={totals.fat ?? 0} />
        <Macro goal={goal?.carbs} label='Carbs' tone='carbs' value={totals.carbs ?? 0} />
      </dl>
    </Card>
  );
}

function EnergyStatus({ consumed, goal }: { consumed: number; goal: number }) {
  const isOver = consumed > goal;

  return (
    <p className={css.energyStatus} data-over={isOver || undefined}>
      <span>
        <strong>
          <CountUp value={Math.round(Math.abs(goal - consumed))} />
        </strong>{' '}
        kcal {isOver ? 'over goal' : 'left'}
      </span>
      {goal > 0 ? <span>{Math.round((consumed / goal) * 100)}%</span> : null}
    </p>
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
  const hasGoal = goal !== null && goal !== undefined;

  return (
    <div className={css.macro} data-over={(hasGoal && value > goal) || undefined} data-tone={tone}>
      <dt>{label}</dt>
      <dd className={css.macroValue}>
        <strong>{Math.round(value)}</strong>
        {hasGoal ? ` / ${Math.round(goal)}` : null} g
      </dd>
      {hasGoal ? (
        <dd className={css.macroMeter}>
          <Meter goal={goal} size='sm' value={value} />
        </dd>
      ) : null}
    </div>
  );
}

/**
 * Progress track shared by kcal and macros, colored by `currentColor`. It scales to whichever of
 * value and goal is larger, so an overage grows from the goal notch instead of clipping at 100%.
 */
function Meter({ goal, size, value }: { goal: number; size: 'sm' | 'lg'; value: number }) {
  const scale = Math.max(value, goal);
  const isOver = value > goal;
  const withinShare = scale > 0 ? (Math.min(value, goal) / scale) * 100 : 0;

  return (
    <div aria-hidden='true' className={css.meter} data-over={isOver || undefined} data-size={size}>
      <span className={css.meterFill} style={{ width: `${withinShare}%` }} />
      <span
        className={css.meterOver}
        style={{ left: `${withinShare}%`, width: `${isOver ? 100 - withinShare : 0}%` }}
      />
      <span className={css.meterMarker} style={{ left: `${withinShare}%` }} />
    </div>
  );
}
