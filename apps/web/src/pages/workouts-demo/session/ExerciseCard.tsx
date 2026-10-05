import clsx from 'clsx';
import { KeyboardIcon, PlusIcon, TimerIcon } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { ContextMenuRoot, ContextMenuTrigger } from '@/components/ui/context-menu/ContextMenu';
import { formatDuration, type MockSet, type MockSlot } from '../mockData';
import type { RestTimer } from '../rest/useRestTimer';
import { RestInline, type RestVariant } from '../rest/RestTimer';
import { ShorthandInput } from '../inputs/ShorthandInput';
import { ExerciseMenu, REST_PRESETS } from './ExerciseMenu';
import { SetRow } from './SetRow';
import type { SessionActions } from './useMockSession';
import css from './Session.module.css';

/** Gives each superset its own rail color so linked cards read as one group. */
const supersetStyle = (slot: MockSlot): CSSProperties & { '--superset-hue': number } => ({
  '--superset-hue': ((slot.supersetGroup ?? 0) * 47) % 360,
});

type ExerciseCardProps = {
  actions: SessionActions;
  restAfterSetId: string | null;
  restVariant: RestVariant;
  onSetCompleted: (slot: MockSlot, set: MockSet) => void;
  slot: MockSlot;
  timer: RestTimer;
};

/** One exercise in a session: header with a long-press menu, set rows, and an add-set footer. */
export function ExerciseCard({
  actions,
  onSetCompleted,
  restAfterSetId,
  restVariant,
  slot,
  timer,
}: ExerciseCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [quickText, setQuickText] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
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
          {slot.supersetGroup !== null ? <span className={css.supersetTag}>superset</span> : null}
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
          onEditNote={() => setEditingNote(true)}
          onRename={() => setRenaming(true)}
          slot={slot}
        />
      </ContextMenuRoot>

      {editingNote ? (
        <input
          aria-label='Note'
          autoFocus
          className={css.noteInput}
          defaultValue={slot.note}
          onBlur={(event) => {
            actions.updateSlot(slot.id, { note: event.target.value });
            setEditingNote(false);
          }}
          onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
          placeholder='Seat height, grip, how it felt…'
        />
      ) : null}
      {!editingNote && slot.note ? <p className={css.note}>{slot.note}</p> : null}

      <div className={css.sets} role='table'>
        {slot.sets.map((set, index) => (
          <div key={set.id}>
            <SetRow
              actions={actions}
              number={workingSetNumbers[index] ?? 0}
              onCompleted={(done) => onSetCompleted(slot, done)}
              set={set}
              slot={slot}
            />
            {restVariant === 'inline' && timer.running && restAfterSetId === set.id ? (
              <RestInline timer={timer} />
            ) : null}
          </div>
        ))}
      </div>

      {quickText ? (
        <ShorthandInput
          compact
          onSubmit={(sets) => {
            actions.addParsedSets(slot.id, sets);
            setQuickText(false);
          }}
        />
      ) : null}
      <div className={css.cardFooter}>
        <button className={css.addSet} onClick={() => actions.addSet(slot.id)} type='button'>
          <PlusIcon aria-hidden='true' /> Set
        </button>
        <button
          aria-pressed={quickText}
          className={css.addSet}
          onClick={() => setQuickText((value) => !value)}
          title='Type sets like 80x5x3'
          type='button'
        >
          <KeyboardIcon aria-hidden='true' /> Type sets
        </button>
      </div>
    </section>
  );
}
