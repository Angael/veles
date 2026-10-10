import { useLiveQuery } from '@tanstack/react-db';
import { useDemoItemsCollection } from './dbLane.collection';
import { logDemoEvent } from './fakeServer';
import { LaneCard, LaneRow } from './LaneCard';
import css from './TanstackDbDemoPage.module.css';

/** TanStack DB: the UI reads the collection, so writes show at once and sync in the background. */
export function TanstackDbLane() {
  const items = useDemoItemsCollection();
  const { data, isLoading } = useLiveQuery(
    (q) => q.from({ item: items }).orderBy(({ item }) => item.createdAt),
    [items],
  );

  return (
    <LaneCard
      lane='db'
      onAdd={() => {
        const name = `Item ${data.length + 1}`;
        logDemoEvent('db', 'ui', `click: add "${name}" → row shows in the same tick`);
        items.insert({ checked: false, createdAt: Date.now(), id: crypto.randomUUID(), name });
      }}
      subtitle='useLiveQuery + collection.insert/update/delete'
      title='TanStack DB'
    >
      {isLoading ? <p className={css.laneEmpty}>Loading…</p> : null}
      <ul className={css.laneItems}>
        {data.map((item) => (
          <LaneRow
            item={item}
            key={item.id}
            onCheckedChange={(checked) => {
              logDemoEvent(
                'db',
                'ui',
                `click: ${checked ? 'check' : 'uncheck'} "${item.name}" → UI updated`,
              );
              items.update(item.id, (draft) => {
                draft.checked = checked;
              });
            }}
            onDelete={() => {
              logDemoEvent('db', 'ui', `click: delete "${item.name}" → row is gone at once`);
              items.delete(item.id);
            }}
          />
        ))}
      </ul>
    </LaneCard>
  );
}
