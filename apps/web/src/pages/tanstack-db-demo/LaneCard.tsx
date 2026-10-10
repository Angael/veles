import { PlusIcon, Trash2Icon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import { type DemoItem, type DemoLane, useDemoState } from './fakeServer';
import css from './TanstackDbDemoPage.module.css';

type LaneCardProps = {
  adding?: boolean;
  children?: ReactNode;
  lane: DemoLane;
  onAdd: () => void;
  subtitle: string;
  title: string;
};

/** Shared frame for one playground lane: header, request counter, list slot, and request log. */
export function LaneCard({ adding, children, lane, onAdd, subtitle, title }: LaneCardProps) {
  const { inFlight, log } = useDemoState();
  const laneLog = log.filter((entry) => entry.lane === lane);

  return (
    <Card as='section' className={css.lane} data-lane={lane}>
      <header className={css.laneHeader}>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span className={css.inFlight} data-active={inFlight[lane] > 0 || undefined}>
          {inFlight[lane]} in flight
        </span>
      </header>
      {children}
      <Btn icon={<PlusIcon aria-hidden='true' />} loading={adding} onClick={onAdd} size='sm'>
        Add item
      </Btn>
      <ol aria-label={`${title} request log`} className={css.log}>
        {laneLog.length === 0 ? (
          <li className={css.logEmpty}>Click something to see requests.</li>
        ) : null}
        {laneLog.map((entry) => (
          <li data-tone={entry.tone} key={entry.id}>
            <time>{(entry.at / 1000).toFixed(1)}s</time>
            <span>{entry.text}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

type LaneRowProps = {
  item: DemoItem;
  onCheckedChange: (checked: boolean) => void;
  onDelete: () => void;
  saving?: boolean;
  deleting?: boolean;
};

export function LaneRow({ deleting, item, onCheckedChange, onDelete, saving }: LaneRowProps) {
  return (
    <li className={css.laneRow}>
      <Checkbox
        aria-label={`Mark ${item.name} as ${item.checked ? 'incomplete' : 'complete'}`}
        checked={item.checked}
        disabled={saving}
        onCheckedChange={onCheckedChange}
      />
      <span className={item.checked ? css.done : undefined}>{item.name}</span>
      {saving ? <span className={css.rowHint}>waiting…</span> : null}
      <Btn
        aria-label={`Delete ${item.name}`}
        icon={<Trash2Icon aria-hidden='true' />}
        iconOnly
        loading={deleting}
        onClick={onDelete}
        size='sm'
        variant='ghostDanger'
      />
    </li>
  );
}
