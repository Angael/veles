import {
  CopyIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  RepeatIcon,
  SaveIcon,
  TimerIcon,
  Trash2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { List, ListItem } from '@/components/ui/list/List';
import { toastManager } from '@/components/ui/toast/toastManager';
import { MOCK_HISTORY, MOCK_ROUTINES, type MockHistoryEntry, type MockRoutine } from '../mockData';
import { QuickLogDialog } from './QuickLogDialog';
import css from './Routines.module.css';

const mock = (title: string) => toastManager.add({ title: `Mock: ${title}` });

/** Workouts home: user-named routines on top, history below, both driven by context menus. */
export function RoutinesDemo() {
  const [quickLogOpen, setQuickLogOpen] = useState(false);

  return (
    <div className={css.page}>
      <div className={css.actions}>
        <Btn
          icon={<PlusIcon aria-hidden='true' />}
          onClick={() => mock('empty session')}
          radius='pill'
        >
          Start empty
        </Btn>
        <Btn
          icon={<TimerIcon aria-hidden='true' />}
          onClick={() => setQuickLogOpen(true)}
          radius='pill'
          variant='outlineMain'
        >
          Log activity
        </Btn>
      </div>

      <section className={css.section}>
        <h2>My routines</h2>
        <div className={css.routines}>
          {MOCK_ROUTINES.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))}
        </div>
      </section>

      <Card as='section' className={css.section}>
        <h2>History</h2>
        <List>
          {MOCK_HISTORY.map((entry) => (
            <HistoryRow entry={entry} key={entry.id} />
          ))}
        </List>
      </Card>

      <QuickLogDialog onOpenChange={setQuickLogOpen} open={quickLogOpen} />
    </div>
  );
}

function RoutineCard({ routine }: { routine: MockRoutine }) {
  const shown = routine.exercises.slice(0, 3);
  const more = routine.exercises.length - shown.length;
  return (
    <ContextMenuRoot>
      <ContextMenuTrigger
        className={css.routine}
        render={<button onClick={() => mock(`start "${routine.name}"`)} type='button' />}
      >
        <strong>{routine.name}</strong>
        <span className={css.routineExercises}>
          {shown.join(' · ')}
          {more > 0 ? ` +${more}` : ''}
        </span>
        <span className={css.meta}>Last: {routine.lastDone}</span>
        <PlayIcon aria-hidden='true' className={css.play} />
      </ContextMenuTrigger>
      <ContextMenuPopup aria-label={`${routine.name} actions`}>
        <ContextMenuItem
          icon={<PlayIcon aria-hidden='true' />}
          label='Start'
          onClick={() => mock('start')}
        />
        <ContextMenuItem
          icon={<PencilIcon aria-hidden='true' />}
          label='Edit'
          onClick={() => mock('edit')}
        />
        <ContextMenuItem
          icon={<CopyIcon aria-hidden='true' />}
          label='Duplicate'
          onClick={() => mock('duplicate')}
        />
        <ContextMenuSeparator />
        <ContextMenuItem
          icon={<Trash2Icon aria-hidden='true' />}
          label='Delete'
          onClick={() => mock('delete, history stays')}
          variant='danger'
        />
      </ContextMenuPopup>
    </ContextMenuRoot>
  );
}

function HistoryRow({ entry }: { entry: MockHistoryEntry }) {
  const facts = [
    `${entry.durationMinutes} min`,
    entry.sets > 0 ? `${entry.sets} sets` : null,
    entry.volumeKg === null ? null : `${entry.volumeKg.toLocaleString()} kg`,
  ].filter(Boolean);

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger render={<ListItem className={css.historyRow} interactive />}>
        <span className={css.date}>{entry.date}</span>
        <strong>{entry.name}</strong>
        <span className={css.meta}>{facts.join(' · ')}</span>
        {entry.note ? <span className={css.note}>{entry.note}</span> : null}
      </ContextMenuTrigger>
      <ContextMenuPopup aria-label={`${entry.name} actions`}>
        <ContextMenuItem
          icon={<PencilIcon aria-hidden='true' />}
          label='Edit'
          onClick={() => mock('edit')}
        />
        <ContextMenuItem
          icon={<RepeatIcon aria-hidden='true' />}
          label='Repeat today'
          onClick={() => mock('new session prefilled from this one')}
        />
        <ContextMenuItem
          icon={<SaveIcon aria-hidden='true' />}
          label='Save as routine'
          onClick={() => mock('saved as routine')}
        />
        <ContextMenuSeparator />
        <ContextMenuItem
          icon={<Trash2Icon aria-hidden='true' />}
          label='Delete'
          onClick={() => mock('delete')}
          variant='danger'
        />
      </ContextMenuPopup>
    </ContextMenuRoot>
  );
}
