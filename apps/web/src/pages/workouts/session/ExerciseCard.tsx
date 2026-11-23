import clsx from 'clsx';
import { HistoryIcon, Undo2Icon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ContextMenuRoot, ContextMenuTrigger } from '@/components/ui/context-menu/ContextMenu';
import type { WorkoutSetData, WorkoutSlotData } from '../workouts.server';
import { ExerciseHistoryDialog } from './ExerciseHistoryDialog';
import { ExerciseMenu } from './ExerciseMenu';
import { ExerciseNote } from './ExerciseNote';
import { ExerciseSets } from './ExerciseSets';
import type { SessionActions } from './session.query';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { selectOnMount } from '@/lib/selectOnMount';

type ExerciseCardProps = {
  actions: SessionActions;
  /** Finished workouts hide set ticks; they only matter while training. */
  finished: boolean;
  isFirst: boolean;
  isLast: boolean;
  /** 1-based position in the workout. */
  number: number;
  onOpenSheet: (setId: string, complete: boolean) => void;
  onSetCompleted: (slot: WorkoutSlotData, set: WorkoutSetData) => void;
  slot: WorkoutSlotData;
  /** First-use tip shown right above the set rows it explains. */
  tip?: ReactNode;
  workoutId: string;
};

/** One exercise in a session: order number, wrapping title with history, note, set rows or a skipped notice. */
export function ExerciseCard({
  actions,
  finished,
  isFirst,
  isLast,
  number,
  onOpenSheet,
  onSetCompleted,
  slot,
  tip,
  workoutId,
}: ExerciseCardProps) {
  const { t } = useI18n();
  const [renaming, setRenaming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <section className={clsx(css.card, slot.skipped && css.skippedCard)}>
      <ContextMenuRoot>
        <ContextMenuTrigger className={css.cardHeader}>
          <span className={css.exerciseNumber}>{number}</span>
          {renaming ? (
            <input
              aria-label={t({ en: 'Exercise name', pl: 'Nazwa ćwiczenia' })}
              className={css.renameInput}
              defaultValue={slot.name}
              onBlur={(event) => {
                const name = event.target.value.trim();
                if (name && name !== slot.name) actions.updateExercise(slot.exerciseId, { name });
                setRenaming(false);
              }}
              onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
              ref={selectOnMount}
            />
          ) : (
            <h3>{slot.name}</h3>
          )}
          <button
            aria-label={t({ en: 'Earlier sessions', pl: 'Wcześniejsze treningi' })}
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
      {slot.skipped ? (
        <div className={css.skippedRow}>
          <span>{t({ en: 'Skipped', pl: 'Pominięte' })}</span>
          <button
            className={css.addSet}
            onClick={() => actions.skipSlot(slot.id, false)}
            type='button'
          >
            <Undo2Icon aria-hidden='true' /> {t({ en: 'Undo skip', pl: 'Cofnij pominięcie' })}
          </button>
        </div>
      ) : (
        <>
          {tip}
          <ExerciseSets
            actions={actions}
            finished={finished}
            onOpenSheet={onOpenSheet}
            onSetCompleted={onSetCompleted}
            slot={slot}
          />
        </>
      )}

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
