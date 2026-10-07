import { HistoryIcon, PlusIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ContextMenuRoot, ContextMenuTrigger } from '@/components/ui/context-menu/ContextMenu';
import type { MockSet, MockSlot } from '../mockData';
import { ExerciseHistoryDialog } from './ExerciseHistoryDialog';
import { ExerciseMenu } from './ExerciseMenu';
import { ExerciseNote } from './ExerciseNote';
import { SetRow } from './SetRow';
import type { SessionActions } from './useMockSession';
import css from './Session.module.css';

type ExerciseCardProps = {
  actions: SessionActions;
  /** 1-based position in the workout. */
  number: number;
  onOpenSheet: (slot: MockSlot, setId: string) => void;
  onSetCompleted: (slot: MockSlot, set: MockSet) => void;
  slot: MockSlot;
  /** First-use tip shown right above the set rows it explains. */
  tip?: ReactNode;
};

/** One exercise in a session: order number, wrapping title with history, note, set rows. */
export function ExerciseCard({
  actions,
  number,
  onOpenSheet,
  onSetCompleted,
  slot,
  tip,
}: ExerciseCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const workingSetNumbers = slot.sets.map(
    (_, index) => slot.sets.slice(0, index + 1).filter((set) => set.type === 'normal').length,
  );

  return (
    <section className={css.card}>
      <ContextMenuRoot>
        <ContextMenuTrigger className={css.cardHeader}>
          <span className={css.exerciseNumber}>{number}</span>
          {renaming ? (
            <input
              aria-label='Exercise name'
              autoFocus
              className={css.renameInput}
              defaultValue={slot.name}
              onBlur={(event) => {
                actions.updateSlot(slot.id, { name: event.target.value || slot.name });
                setRenaming(false);
              }}
              onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
            />
          ) : (
            <h3>{slot.name}</h3>
          )}
          <button
            aria-label='Earlier sessions'
            className={css.historyButton}
            onClick={() => setHistoryOpen(true)}
            type='button'
          >
            <HistoryIcon aria-hidden='true' />
          </button>
        </ContextMenuTrigger>
        <ExerciseMenu actions={actions} onRename={() => setRenaming(true)} slot={slot} />
      </ContextMenuRoot>

      <ExerciseNote actions={actions} slot={slot} />
      {tip}

      <div className={css.sets} role='table'>
        {slot.sets.map((set, index) => (
          <SetRow
            actions={actions}
            key={set.id}
            number={workingSetNumbers[index] ?? 0}
            onCompleted={(done) => onSetCompleted(slot, done)}
            onOpenSheet={() => onOpenSheet(slot, set.id)}
            set={set}
            slot={slot}
          />
        ))}
      </div>

      <div className={css.cardFooter}>
        <button
          className={css.addSet}
          onClick={() => actions.addSet(slot.id)}
          title='Adds one set, copying the last one'
          type='button'
        >
          <PlusIcon aria-hidden='true' /> Add set
        </button>
      </div>

      <ExerciseHistoryDialog
        exerciseName={slot.name}
        onOpenChange={setHistoryOpen}
        open={historyOpen}
      />
    </section>
  );
}
