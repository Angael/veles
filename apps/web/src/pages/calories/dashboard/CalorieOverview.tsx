import { useState } from 'react';
import type { CalorieGoal, CalorieLog, CalorieTotals } from '../calories.api';
import { DailySummary } from './DailySummary';
import { LogFoodMenu } from './LogFoodMenu';
import { LogSelectionActions } from './LogSelectionActions';
import { LoggedFood } from './LoggedFood';
import { Btn } from '@/components/ui/btn/Btn';
import { List } from '@/components/ui/list/List';
import css from './CaloriesPage.module.css';
import selectionCss from './LogSelection.module.css';

type Props = {
  date: string;
  goal: CalorieGoal | null;
  logs: CalorieLog[];
  totals: CalorieTotals;
};

const sampleLogs = [
  {
    id: 'preview-oats',
    name: 'Oats with milk',
    grams: 250,
    kcal: 315,
    protein: 14,
    fat: 9,
    carbs: 45,
    imageUrl: null,
  },
  {
    id: 'preview-yogurt',
    name: 'Greek yogurt',
    grams: 180,
    kcal: 170,
    protein: 18,
    fat: 5,
    carbs: 12,
    imageUrl: null,
  },
  {
    id: 'preview-banana',
    name: 'Banana',
    grams: 120,
    kcal: 105,
    protein: 1,
    fat: 0,
    carbs: 27,
    imageUrl: null,
  },
] satisfies Pick<
  CalorieLog,
  'id' | 'name' | 'grams' | 'kcal' | 'protein' | 'fat' | 'carbs' | 'imageUrl'
>[];

/** Keeps the selection prototype local to one day; neither bulk action changes diary data. */
export function CalorieOverview({ date, goal, logs, totals }: Props) {
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [deleteFeedback, setDeleteFeedback] = useState(false);
  const isSample = logs.length === 0;
  const entries = (isSample ? sampleLogs : logs).filter((entry) => !hiddenIds.includes(entry.id));
  const selectedLogs = entries.filter((entry) => selectedIds.includes(entry.id));
  const allSelected = entries.length > 0 && selectedLogs.length === entries.length;

  function stopSelecting() {
    setSelecting(false);
    setSelectedIds([]);
  }

  function previewDelete() {
    setHiddenIds((current) => [...current, ...selectedLogs.map((entry) => entry.id)]);
    setDeleteFeedback(true);
    stopSelecting();
  }

  return (
    <div className={css.overviewStack}>
      {!selecting ? <LogFoodMenu date={date} /> : null}
      <DailySummary goal={goal} totals={totals} />

      <section className={css.logSection} data-appear='2'>
        <div className={css.logHeading}>
          <h2>Logged products</h2>
          {entries.length ? (
            <Btn
              onClick={() => (selecting ? stopSelecting() : setSelecting(true))}
              size='sm'
              variant='outlineMain'
            >
              {selecting ? 'Cancel' : 'Select'}
            </Btn>
          ) : null}
        </div>
        {isSample ? (
          <p className={selectionCss.sampleNote}>
            Nothing logged for this day. Try selecting these sample products; they are not in your
            diary or totals.
          </p>
        ) : null}
        {deleteFeedback ? (
          <p aria-live='polite' className={selectionCss.feedback}>
            Preview only: selected products are hidden here. Nothing was deleted; diary totals stay
            the same.{' '}
            <Btn
              onClick={() => {
                setHiddenIds([]);
                setDeleteFeedback(false);
              }}
              size='sm'
              variant='text'
            >
              Restore preview
            </Btn>
          </p>
        ) : null}
        {selecting && entries.length > 1 ? (
          <label className={selectionCss.selectAll}>
            <input
              checked={allSelected}
              onChange={(event) =>
                setSelectedIds(event.target.checked ? entries.map((entry) => entry.id) : [])
              }
              type='checkbox'
            />
            Select all
          </label>
        ) : null}
        {entries.length ? (
          <List as='ol'>
            {entries.map((entry) => (
              <LoggedFood
                date={date}
                entry={entry}
                key={entry.id}
                onSelect={(id, checked) =>
                  setSelectedIds((current) =>
                    checked ? [...current, id] : current.filter((selectedId) => selectedId !== id),
                  )
                }
                sample={isSample}
                selected={selectedIds.includes(entry.id)}
                selecting={selecting}
              />
            ))}
          </List>
        ) : (
          <p className={css.emptyLog}>
            {deleteFeedback ? 'All products hidden in this preview' : 'Nothing logged for this day'}
          </p>
        )}
      </section>
      {selecting ? (
        <LogSelectionActions
          key={selectedIds.join(',')}
          onCancel={stopSelecting}
          onDelete={previewDelete}
          selectedLogs={selectedLogs}
        />
      ) : null}
    </div>
  );
}
