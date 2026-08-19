import { Link } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
import { Btn } from '@/components/btn/Btn';
import type { CalorieGoal, CalorieLog, CalorieTotals } from '../calories.api';
import { DailySummary } from './DailySummary';
import { LoggedFood } from './LoggedFood';
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

      <section className={css.logSection} data-appear='2'>
        <div className={css.logHeading}>
          <h2>Logged products</h2>
        </div>
        {logs.length ? (
          <ol className={css.logList}>
            {logs.map((entry) => (
              <LoggedFood date={date} entry={entry} key={entry.id} />
            ))}
          </ol>
        ) : (
          <div className={css.emptyLog}>
            <div>
              <strong>Nothing logged for this day</strong>
              <span>Start with a saved food, scan a package, or enter the totals directly.</span>
            </div>
            <div className={css.emptyActions}>
              <Btn
                icon={<PlusIcon aria-hidden='true' />}
                isLink
                render={<Link search={{ date }} to='/calories/add' />}
              >
                Add your first food
              </Btn>
              <Btn
                isLink
                render={<Link search={{ date }} to='/calories/scan' />}
                variant='outlineMain'
              >
                Scan barcode
              </Btn>
              <Btn
                isLink
                render={<Link search={{ date }} to='/calories/quick-add' />}
                variant='ghost'
              >
                Quick add
              </Btn>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
