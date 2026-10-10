import { useQuery } from '@tanstack/react-query';
import { logDemoEvent } from './fakeServer';
import { LaneCard, LaneRow } from './LaneCard';
import {
  rqItemsQueryOptions,
  useRqCreateMutation,
  useRqDeleteMutation,
  useRqSetCheckedMutation,
} from './reactQueryLane.query';
import css from './TanstackDbDemoPage.module.css';

/** Plain React Query: the UI shows server data only, so every write waits for POST + refetch. */
export function ReactQueryLane() {
  const { data: items = [], isPending } = useQuery(rqItemsQueryOptions());
  const setChecked = useRqSetCheckedMutation();
  const create = useRqCreateMutation();
  const remove = useRqDeleteMutation();

  return (
    <LaneCard
      adding={create.isPending}
      lane='rq'
      onAdd={() => {
        logDemoEvent('rq', 'ui', 'click: add → button spins until the server answers');
        create.mutate({ id: crypto.randomUUID(), name: `Item ${items.length + 1}` });
      }}
      subtitle='useQuery + useMutation + invalidate'
      title='React Query'
    >
      {isPending ? <p className={css.laneEmpty}>Loading…</p> : null}
      <ul className={css.laneItems}>
        {items.map((item) => (
          <LaneRow
            deleting={remove.isPending && remove.variables.id === item.id}
            item={item}
            key={item.id}
            onCheckedChange={(checked) => {
              logDemoEvent('rq', 'ui', `click: ${checked ? 'check' : 'uncheck'} "${item.name}"`);
              setChecked.mutate({ checked, id: item.id });
            }}
            onDelete={() => {
              logDemoEvent('rq', 'ui', `click: delete "${item.name}"`);
              remove.mutate({ id: item.id });
            }}
            saving={setChecked.isPending && setChecked.variables.id === item.id}
          />
        ))}
      </ul>
    </LaneCard>
  );
}
