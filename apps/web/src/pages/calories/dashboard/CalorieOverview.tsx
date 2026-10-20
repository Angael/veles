import { useState } from 'react';
import type { CalorieDashboardDay } from '../calories.api';
import { DailySummary } from './DailySummary';
import { DayNote } from './DayNote';
import { DeleteLogsAction } from './DeleteLogsAction';
import { LogFoodMenu } from './LogFoodMenu';
import { LoggedFood } from './LoggedFood';
import { LogsDateAction } from './LogsDateAction';
import { MultiplyLogsAction } from './MultiplyLogsAction';
import { ReceivedFoodShares } from './ReceivedFoodShares';
import { ShareLogsAction } from './ShareLogsAction';
import { useCancelSelectionOnBack } from './useCancelSelectionOnBack';
import { Btn } from '@/components/ui/btn/Btn';
import { List } from '@/components/ui/list/List';
import { SelectionBar } from '@/components/ui/selection-bar/SelectionBar';
import css from './CaloriesPage.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type Props = { day: CalorieDashboardDay };

/** Day overview; selecting logs via their images swaps the Log food button for bulk actions. */
export function CalorieOverview({ day }: Props) {
  const { date, goal, logs, totals } = day;
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedLogs = logs.filter((entry) => selectedIds.includes(entry.id));
  const selecting = selectedLogs.length > 0;
  const allSelected = selectedLogs.length === logs.length;
  const clearSelection = () => setSelectedIds([]);
  useCancelSelectionOnBack(selecting, clearSelection);

  function setSelected(id: string, selected: boolean) {
    setSelectedIds((current) =>
      selected ? [...current, id] : current.filter((selectedId) => selectedId !== id),
    );
  }

  return (
    <div className={css.overviewStack}>
      {selecting ? (
        <SelectionBar
          aria-label={t({ en: 'Selected products', pl: 'Wybrane produkty' })}
          count={selectedLogs.length}
          onClear={clearSelection}
        >
          <MultiplyLogsAction logs={selectedLogs} onMultiplied={clearSelection} />
          <LogsDateAction date={date} logs={selectedLogs} mode='move' onDone={clearSelection} />
          <LogsDateAction date={date} logs={selectedLogs} mode='copy' onDone={clearSelection} />
          <DeleteLogsAction logs={selectedLogs} onDeleted={clearSelection} />
          <ShareLogsAction logs={selectedLogs} onShared={clearSelection} />
        </SelectionBar>
      ) : (
        <LogFoodMenu date={date} />
      )}
      <DailySummary goal={goal} totals={totals} />
      <DayNote date={date} note={day.note} offPlan={day.offPlan} />

      <section className={css.logSection} data-appear='2'>
        <div className={css.logHeading}>
          <h2>{t({ en: 'Logged products', pl: 'Zapisane produkty' })}</h2>
          {selecting ? (
            <Btn
              onClick={() => setSelectedIds(allSelected ? [] : logs.map((entry) => entry.id))}
              size='sm'
              variant='text'
            >
              {allSelected
                ? t({ en: 'Deselect all', pl: 'Odznacz wszystko' })
                : t({ en: 'Select all', pl: 'Zaznacz wszystko' })}
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
          <p className={css.emptyLog}>
            {t({ en: 'Nothing logged for this day', pl: 'Brak wpisów w tym dniu' })}
          </p>
        )}
      </section>
    </div>
  );
}
