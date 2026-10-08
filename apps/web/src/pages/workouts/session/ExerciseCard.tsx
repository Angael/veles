import { HistoryIcon, PlusIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ContextMenuRoot, ContextMenuTrigger } from '@/components/ui/context-menu/ContextMenu';
import { workingSetNumbers } from '../metrics';
import type { WorkoutSetData, WorkoutSlotData } from '../workouts.server';
import { ExerciseHistoryDialog } from './ExerciseHistoryDialog';
import { ExerciseMenu } from './ExerciseMenu';
import { ExerciseNote } from './ExerciseNote';
import type { SessionActions } from './session.query';
import { SetRow } from './SetRow';
import css from './Session.module.css';

type ExerciseCardProps = {
  actions: SessionActions;
  isFirst: boolean;
  isLast: boolean;
  /** 1-based position in the workout. */
  number: number;
  onOpenSheet: (setId: string, complete?: boolean) => void;
  onSetCompleted: (slot: WorkoutSlotData, set: WorkoutSetData) => void;
  slot: WorkoutSlotData;
  /** First-use tip shown right above the set rows it explains. */
  tip?: ReactNode;
  workoutId: string;
};

/** One exercise in a session: order number, wrapping title with history, note, set rows. */
export function ExerciseCard({
  actions,
  isFirst,
  isLast,
  number,
  onOpenSheet,
  onSetCompleted,
  slot,
  tip,
  workoutId,
}: ExerciseCardProps) {
  const [renaming, setRenaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const numbers = workingSetNumbers(slot.sets);

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
                const name = event.target.value.trim();
                if (name && name !== slot.name) actions.updateExercise(slot.exerciseId, { name });
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
        <ExerciseMenu
          actions={actions}
          isFirst={isFirst}
          isLast={isLast}
          onRename={() => setRenaming(true)}
          slot={slot}
        />
      </ContextMenuRoot>

      <ExerciseNote actions={actions} slot={slot} />
      {tip}

      <div className={css.sets} role='table'>
        {slot.sets.map((set, index) => (
          <SetRow
            actions={actions}
            key={set.id}
            number={numbers[index] ?? 0}
            onCompleted={(done) => onSetCompleted(slot, done)}
            onOpenSheet={(complete) => onOpenSheet(set.id, complete)}
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
        exerciseId={slot.exerciseId}
        exerciseName={slot.name}
        onOpenChange={setHistoryOpen}
        open={historyOpen}
        workoutId={workoutId}
      />
    </section>
  );
}
