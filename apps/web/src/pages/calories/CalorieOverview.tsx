import { FlameIcon, UtensilsIcon } from 'lucide-react';
import type { CalorieGoal, CalorieLog, CalorieTotals } from './calories.api';
import { Card } from '@/components/card/Card';
import css from './CaloriesPage.module.css';

type Props = { goal: CalorieGoal | null; logs: CalorieLog[]; totals: CalorieTotals };

export function CalorieOverview({ goal, logs, totals }: Props) {
  const progress = goal ? Math.min((totals.kcal / goal.kcal) * 100, 100) : 0;
  return (
    <div className={css.overviewStack}>
      <Card as='section' className={css.hero}>
        <div className={css.heroCopy}>
          <span className={css.sectionLabel}>Selected day</span>
          <div className={css.energyLine}>
            <strong>{formatNumber(totals.kcal)}</strong>
            <span>kcal logged</span>
          </div>
          <p>
            {goal
              ? `${formatNumber(Math.abs(goal.kcal - totals.kcal))} kcal ${totals.kcal <= goal.kcal ? 'remaining' : 'over goal'}`
              : 'Set a goal to see what remains.'}
          </p>
        </div>
        <div
          aria-label={goal ? `${Math.round(progress)} percent of goal` : 'No goal'}
          className={css.progress}
          role='img'
        >
          <FlameIcon aria-hidden='true' />
          <span>{goal ? `${Math.round(progress)}%` : '—'}</span>
        </div>
      </Card>
      <div aria-label='Macronutrient totals' className={css.macroGrid}>
        <Macro label='Protein' total={totals.protein} target={goal?.protein ?? null} />
        <Macro label='Carbs' total={totals.carbs} target={goal?.carbs ?? null} />
        <Macro label='Fat' total={totals.fat} target={goal?.fat ?? null} />
      </div>
      <Card as='section' className={css.logCard}>
        <div className={css.sectionHeading}>
          <div>
            <h2>Food log</h2>
            <p>
              {logs.length
                ? `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'}`
                : 'Nothing logged yet.'}
            </p>
          </div>
        </div>
        {logs.length ? (
          <ol className={css.logList}>
            {logs.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.name}</strong>
                  <span>
                    {entry.grams === null ? 'Quick entry' : `${formatNumber(entry.grams)} g`}
                  </span>
                </div>
                <span className={css.logEnergy}>{formatNumber(entry.kcal)} kcal</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className={css.emptyLog}>
            <UtensilsIcon aria-hidden='true' />
            <strong>Your diary is empty</strong>
            <span>Choose an action above to add your first entry.</span>
          </div>
        )}
      </Card>
    </div>
  );
}

function Macro({
  label,
  target,
  total,
}: {
  label: string;
  target: number | null;
  total: number | null;
}) {
  return (
    <Card className={css.macroStat} shadow={false}>
      <span>{label}</span>
      <strong>{total === null ? 'Unknown' : `${formatNumber(total)} g`}</strong>
      <small>{target === null ? 'No target' : `of ${formatNumber(target)} g`}</small>
    </Card>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}
