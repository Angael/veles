import { useState } from 'react';
import type { CalorieGoal, CalorieLog, CalorieTotals } from '../calories.api';
import { DailySummary } from './DailySummary';
import { LogFoodMenu } from './LogFoodMenu';
import { LoggedFood } from './LoggedFood';
import { ReceivedFoodShares } from './ReceivedFoodShares';
import { SelectionBar } from './SelectionBar';
import { Btn } from '@/components/ui/btn/Btn';
import { List } from '@/components/ui/list/List';
import css from './CaloriesPage.module.css';

type Props = {
  date: string;
  goal: CalorieGoal | null;
  logs: CalorieLog[];
  totals: CalorieTotals;
};

/** Day overview; selecting logs via their images swaps the Log food button for sharing actions. */
export function CalorieOverview({ date, goal, logs, totals }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedCount = logs.filter((entry) => selectedIds.includes(entry.id)).length;
  const selecting = selectedCount > 0;
  const allSelected = selectedCount === logs.length;

  function setSelected(id: string, selected: boolean) {
    setSelectedIds((current) =>
      selected ? [...current, id] : current.filter((selectedId) => selectedId !== id),
    );
  }

  return (
    <div className={css.overviewStack}>
      {selecting ? (
        <SelectionBar count={selectedCount} onClear={() => setSelectedIds([])} />
      ) : (
        <LogFoodMenu date={date} />
      )}
      <DailySummary goal={goal} totals={totals} />

      <section className={css.logSection} data-appear='2'>
        <div className={css.logHeading}>
          <h2>Logged products</h2>
          {selecting ? (
            <Btn
              onClick={() => setSelectedIds(allSelected ? [] : logs.map((entry) => entry.id))}
              size='sm'
              variant='text'
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </Btn>
          ) : null}
        </div>
        <ReceivedFoodShares />
        {logs.length ? (
          <List as='ol' data-selecting={selecting || undefined}>
            {logs.map((entry) => (
              <LoggedFood
                date={date}
                entry={entry}
                key={entry.id}
                onSelectedChange={setSelected}
                selected={selectedIds.includes(entry.id)}
              />
            ))}
          </List>
        ) : (
          <p className={css.emptyLog}>Nothing logged for this day</p>
        )}
      </section>
    </div>
  );
}
