import clsx from 'clsx';
import { HistoryIcon, ListPlusIcon, PlusIcon, StickyNoteIcon, TimerIcon } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { ContextMenuRoot, ContextMenuTrigger } from '@/components/ui/context-menu/ContextMenu';
import { formatDuration, historyFor, type MockSet, type MockSlot } from '../mockData';
import type { RestTimer } from '../rest/useRestTimer';
import { RestInline, type RestVariant } from '../rest/RestTimer';
import { ShorthandInput } from '../inputs/ShorthandInput';
import { ExerciseHistoryDialog } from './ExerciseHistoryDialog';
import { ExerciseMenu, REST_PRESETS } from './ExerciseMenu';
import { ExerciseNote } from './ExerciseNote';
import { SetRow, type CellMode } from './SetRow';
import type { SessionActions } from './useMockSession';
import css from './Session.module.css';

/** Gives each superset its own rail color so linked cards read as one group. */
const supersetStyle = (slot: MockSlot): CSSProperties & { '--superset-hue': number } => ({
  '--superset-hue': ((slot.supersetGroup ?? 0) * 47) % 360,
});

type ExerciseCardProps = {
  actions: SessionActions;
  cellMode: CellMode;
  onOpenSheet: (slot: MockSlot, setId: string) => void;
  onSetCompleted: (slot: MockSlot, set: MockSet) => void;
  restAfterSetId: string | null;
  restVariant: RestVariant;
  slot: MockSlot;
  timer: RestTimer;
};

/** One exercise in a session: wrapping title, header actions and a long-press menu, set rows. */
export function ExerciseCard({
  actions,
  cellMode,
  onOpenSheet,
  onSetCompleted,
  restAfterSetId,
  restVariant,
  slot,
  timer,
}: ExerciseCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [addSeveral, setAddSeveral] = useState(false);
  const [noteOpen, setNoteOpen] = useState(slot.note !== '');
  const [historyOpen, setHistoryOpen] = useState(false);
  const hasLastNote = historyFor(slot.name).some((entry) => entry.note);
  const workingSetNumbers = slot.sets.map(
    (_, index) => slot.sets.slice(0, index + 1).filter((set) => set.type === 'normal').length,
  );

  return (
    <section
      className={clsx(css.card, slot.supersetGroup !== null && css.superset)}
      style={supersetStyle(slot)}
    >
      <ContextMenuRoot>
        <ContextMenuTrigger className={css.cardHeader}>
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
            aria-label={noteOpen ? 'Hide note' : 'Add note'}
            aria-pressed={noteOpen}
            className={clsx(css.iconChip, hasLastNote && !noteOpen && css.hasDot)}
            onClick={() => setNoteOpen((open) => !open)}
            title={hasLastNote ? 'Note (last time has one)' : 'Note'}
            type='button'
          >
            <StickyNoteIcon aria-hidden='true' />
          </button>
          <button
            aria-label='Earlier sessions'
            className={css.iconChip}
            onClick={() => setHistoryOpen(true)}
            type='button'
          >
            <HistoryIcon aria-hidden='true' />
          </button>
          <button
            className={css.restChip}
            onClick={() => {
              const index = REST_PRESETS.findIndex((seconds) => seconds === slot.restSeconds);
              actions.updateSlot(slot.id, {
                restSeconds: REST_PRESETS[(index + 1) % REST_PRESETS.length] ?? null,
              });
            }}
            title='Rest after each set. Tap to change.'
            type='button'
          >
            <TimerIcon aria-hidden='true' />
            {slot.restSeconds === null ? 'off' : formatDuration(slot.restSeconds)}
          </button>
        </ContextMenuTrigger>
        <ExerciseMenu
          actions={actions}
          onEditNote={() => setNoteOpen(true)}
          onRename={() => setRenaming(true)}
          slot={slot}
        />
      </ContextMenuRoot>

      {noteOpen ? (
        <ExerciseNote actions={actions} onClose={() => setNoteOpen(false)} slot={slot} />
      ) : null}

      <div className={css.sets} role='table'>
        {slot.sets.map((set, index) => (
          <div key={set.id}>
            <SetRow
              actions={actions}
              cellMode={cellMode}
              number={workingSetNumbers[index] ?? 0}
              onCompleted={(done) => onSetCompleted(slot, done)}
              onOpenSheet={() => onOpenSheet(slot, set.id)}
              set={set}
              slot={slot}
            />
            {restVariant === 'inline' && timer.running && restAfterSetId === set.id ? (
              <RestInline timer={timer} />
            ) : null}
          </div>
        ))}
      </div>

      {addSeveral ? (
        <ShorthandInput
          compact
          measure={slot.measure}
          onSubmit={(sets) => {
            actions.addParsedSets(slot.id, sets);
            setAddSeveral(false);
          }}
        />
      ) : null}
      <div className={css.cardFooter}>
        <button
          className={css.addSet}
          onClick={() => actions.addSet(slot.id)}
          title='Adds one set, copying the last one'
          type='button'
        >
          <PlusIcon aria-hidden='true' /> Add set
        </button>
        <button
          aria-pressed={addSeveral}
          className={css.addSet}
          onClick={() => setAddSeveral((value) => !value)}
          title='Type many sets at once, like 80x5x3'
          type='button'
        >
          <ListPlusIcon aria-hidden='true' /> Add several…
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
