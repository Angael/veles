import type { CalorieGoal, CalorieLog, CalorieTotals } from '../calories.api';
import { DailySummary } from './DailySummary';
import { LoggedFood } from './LoggedFood';
import { Card } from '@/components/card/Card';
import css from './CaloriesPage.module.css';

type Props = {
  date: string;
  goal: CalorieGoal | null;
  logs: CalorieLog[];
  totals: CalorieTotals;
};

export function CalorieOverview({ date, goal, logs, totals }: Props) {
  return (
    <div className={css.overviewStack}>
      <DailySummary goal={goal} totals={totals} />

      <Card as='section' className={css.logCard}>
        <div className={css.sectionHeading}>
          <h2>Logged products</h2>
        </div>
        {logs.length ? (
          <ol className={css.logList}>
            {logs.map((entry) => (
              <LoggedFood date={date} entry={entry} key={entry.id} />
            ))}
          </ol>
        ) : (
          <p className={css.emptyLog}>Nothing logged for this day.</p>
        )}
      </Card>
    </div>
  );
}
