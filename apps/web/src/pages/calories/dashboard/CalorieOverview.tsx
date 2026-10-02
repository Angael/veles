import { useState } from 'react';
import type { CalorieGoal, CalorieLog, CalorieTotals } from '../calories.api';
import { DailySummary } from './DailySummary';
import { DeleteLogsAction } from './DeleteLogsAction';
import { LogFoodMenu } from './LogFoodMenu';
import { LoggedFood } from './LoggedFood';
import { MultiplyLogsAction } from './MultiplyLogsAction';
import { ReceivedFoodShares } from './ReceivedFoodShares';
import { ShareLogsAction } from './ShareLogsAction';
import { Btn } from '@/components/ui/btn/Btn';
import { List } from '@/components/ui/list/List';
import { SelectionBar } from '@/components/ui/selection-bar/SelectionBar';
import css from './CaloriesPage.module.css';

type Props = {
  date: string;
  goal: CalorieGoal | null;
  logs: CalorieLog[];
  totals: CalorieTotals;
};

/** Day overview; selecting logs via their images swaps the Log food button for bulk actions. */
export function CalorieOverview({ date, goal, logs, totals }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedLogs = logs.filter((entry) => selectedIds.includes(entry.id));
  const selecting = selectedLogs.length > 0;
  const allSelected = selectedLogs.length === logs.length;
  const clearSelection = () => setSelectedIds([]);

  function setSelected(id: string, selected: boolean) {
    setSelectedIds((current) =>
      selected ? [...current, id] : current.filter((selectedId) => selectedId !== id),
    );
  }

  return (
    <div className={css.overviewStack}>
      {selecting ? (
        <SelectionBar
          aria-label='Selected products'
          count={selectedLogs.length}
          onClear={clearSelection}
        >
          <MultiplyLogsAction logs={selectedLogs} onMultiplied={clearSelection} />
          <DeleteLogsAction logs={selectedLogs} onDeleted={clearSelection} />
          <ShareLogsAction logs={selectedLogs} onShared={clearSelection} />
        </SelectionBar>
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
        <ReceivedFoodShares date={date} />
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
