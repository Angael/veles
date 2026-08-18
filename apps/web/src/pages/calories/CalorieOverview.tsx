import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { CalorieGoal, CalorieLog, CalorieTotals } from './calories.api';
import { deleteFoodLog } from './calories.api';
import { invalidateCalorieWeek } from './calorieQueries';
import { PencilIcon, Trash2Icon } from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './CaloriesPage.module.css';

type Props = {
  date: string;
  goal: CalorieGoal | null;
  logs: CalorieLog[];
  totals: CalorieTotals;
};
const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export function CalorieOverview({ date, goal, logs, totals }: Props) {
  const queryClient = useQueryClient();
  const remaining = goal ? goal.kcal - totals.kcal : null;
  async function remove(id: string) {
    await deleteFoodLog({ data: { id } });
    await invalidateCalorieWeek(queryClient, date);
  }
  return (
    <div className={css.overviewStack}>
      <Card as='section' className={css.dailySummary}>
        <div className={css.energySummary}>
          <span>
            {remaining === null ? 'Daily energy' : remaining >= 0 ? 'Remaining' : 'Over goal'}
          </span>
          <strong>
            {remaining === null
              ? `${number(totals.kcal)} kcal`
              : `${number(Math.abs(remaining))} kcal`}
          </strong>
          <small>
            {goal
              ? `${number(totals.kcal)} out of ${number(goal.kcal)} kcal`
              : 'No calorie goal set'}
          </small>
        </div>
        <div className={css.summaryMacros}>
          <Macro
            label='Protein'
            tone='protein'
            total={totals.protein ?? 0}
            target={goal?.protein ?? null}
          />
          <Macro label='Fat' tone='fat' total={totals.fat ?? 0} target={goal?.fat ?? null} />
          <Macro
            label='Carbs'
            tone='carbs'
            total={totals.carbs ?? 0}
            target={goal?.carbs ?? null}
          />
        </div>
      </Card>
      <Card as='section' className={css.logCard}>
        <div className={css.sectionHeading}>
          <h2>Logged products</h2>
        </div>
        {logs.length ? (
          <ol className={css.logList}>
            {logs.map((entry) => (
              <li key={entry.id}>
                <div className={css.logMain}>
                  <strong>{entry.name}</strong>
                  <span>{entry.grams === null ? 'Custom entry' : `${number(entry.grams)} g`}</span>
                  <small>
                    {number(entry.kcal)} kcal · {number(entry.protein ?? 0)} g protein ·{' '}
                    {number(entry.fat ?? 0)} g fat · {number(entry.carbs ?? 0)} g carbs
                  </small>
                </div>
                <div className={css.logActions}>
                  <Btn
                    aria-label={`Edit ${entry.name}`}
                    className={css.logAction}
                    icon={<PencilIcon aria-hidden='true' />}
                    iconOnly
                    isLink
                    render={<Link params={{ logId: entry.id }} to='/calories/logs/$logId' />}
                    size='sm'
                    variant='ghost'
                  />
                  <Btn
                    aria-label={`Delete ${entry.name}`}
                    className={css.logAction}
                    icon={<Trash2Icon aria-hidden='true' />}
                    iconOnly
                    onClick={() => void remove(entry.id)}
                    size='sm'
                    variant='ghostDanger'
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className={css.emptyLog}>Nothing logged for this day.</p>
        )}
      </Card>
    </div>
  );
}
function Macro({
  label,
  target,
  tone,
  total,
}: {
  label: string;
  target: number | null;
  tone: 'protein' | 'fat' | 'carbs';
  total: number;
}) {
  return (
    <div className={css[tone]}>
      <span>{label}</span>
      <strong>{number(total)} g</strong>
      <small>{target === null ? null : ` / ${number(target)} g`}</small>
    </div>
  );
}
function number(value: number) {
  return numberFormatter.format(value);
}
