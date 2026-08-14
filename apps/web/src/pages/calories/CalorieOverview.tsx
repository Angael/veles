import { useRouter } from '@tanstack/react-router';
import type { CalorieGoal, CalorieLog, CalorieTotals } from './calories.api';
import { deleteFoodLog } from './calories.api';
import { Btn } from '@/components/btn/Btn';
import { Card } from '@/components/card/Card';
import css from './CaloriesPage.module.css';

type Props = { goal: CalorieGoal | null; logs: CalorieLog[]; totals: CalorieTotals };
const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export function CalorieOverview({ goal, logs, totals }: Props) {
  const router = useRouter();
  const remaining = goal ? goal.kcal - totals.kcal : null;
  async function remove(id: string) {
    await deleteFoodLog({ data: { id } });
    await router.invalidate();
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
          <Macro label='Protein' total={totals.protein ?? 0} target={goal?.protein ?? null} />
          <Macro label='Fat' total={totals.fat ?? 0} target={goal?.fat ?? null} />
          <Macro label='Carbs' total={totals.carbs ?? 0} target={goal?.carbs ?? null} />
        </div>
      </Card>
      <Card as='section' className={css.logCard}>
        <div className={css.sectionHeading}>
          <div>
            <h2>Logged products</h2>
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
                <div className={css.logMain}>
                  <strong>{entry.name}</strong>
                  <span>{entry.grams === null ? 'Custom entry' : `${number(entry.grams)} g`}</span>
                  <small>
                    {number(entry.kcal)} kcal · {number(entry.protein ?? 0)} g protein ·{' '}
                    {number(entry.fat ?? 0)} g fat · {number(entry.carbs ?? 0)} g carbs
                  </small>
                </div>
                <div className={css.logActions}>
                  <Btn onClick={() => void remove(entry.id)} variant='ghost'>
                    Delete
                  </Btn>
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
function Macro({ label, target, total }: { label: string; target: number | null; total: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{number(total)} g</strong>
      <small>{target === null ? null : ` / ${number(target)} g`}</small>
    </div>
  );
}
function number(value: number) {
  return numberFormatter.format(value);
}
