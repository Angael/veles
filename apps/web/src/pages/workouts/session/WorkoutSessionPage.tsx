import { useSuspenseQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { ExercisePickerDialog } from '../exercises/ExercisePicker';
import { FeatureTip, HINTS } from '../hints/FeatureTip';
import { useSeenHints } from '../hints/useHints';
import { RestDock } from '../rest/RestTimer';
import { useRestTimer } from '../rest/useRestTimer';
import { workoutSessionQueryOptions } from '../workouts.query';
import type { WorkoutSetData, WorkoutSlotData } from '../workouts.server';
import { ExerciseCard } from './ExerciseCard';
import { SessionHeader } from './SessionHeader';
import { useSessionActions } from './session.query';
import { SetSheet } from './SetSheet';
import css from './Session.module.css';

/**
 * Live workout: the screen you stare at between sets. Every edit saves right away; ticking a set
 * starts the rest timer.
 */
export function WorkoutSessionPage({ workoutId }: { workoutId: string }) {
  const { data: session } = useSuspenseQuery(workoutSessionQueryOptions(workoutId));
  const actions = useSessionActions(workoutId);
  const timer = useRestTimer();
  const hints = useSeenHints();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheet, setSheet] = useState<{ slotId: string; setId: string; complete: boolean } | null>(
    null,
  );

  const sheetSlot = session.slots.find((slot) => slot.id === sheet?.slotId);
  const sheetSet = sheetSlot?.sets.find((set) => set.id === sheet?.setId);
  const nextHint = HINTS.find((hint) => hints.seen !== null && !hints.seen.includes(hint.key));
  const ownsTimer = timer.running && timer.ownerId === workoutId;
  const finished = session.endedAt !== null;

  // A finished workout (by hand or after two idle hours) has no rest left to count.
  useEffect(() => {
    if (finished && ownsTimer) timer.skip();
  }, [finished, ownsTimer, timer]);

  /**
   * Starts rest after a ticked set. Ticking a set that sits before an already done one is
   * catching up on forgotten ticks, so it leaves the running timer alone.
   */
  function onSetCompleted(slot: WorkoutSlotData, set: WorkoutSetData) {
    if (slot.restSeconds === null) return;
    const index = slot.sets.findIndex((item) => item.id === set.id);
    if (slot.sets.slice(index + 1).some((item) => item.done)) return;
    if (finished) return;
    timer.start(slot.restSeconds, slot.name, workoutId);
  }

  return (
    <div className={css.session}>
      <SessionHeader onFinish={timer.skip} onShowHints={hints.reset} session={session} />

      {session.slots.length === 0 ? (
        <p className={css.empty}>Add the first exercise to start logging sets.</p>
      ) : (
        <div className={css.cards}>
          {session.slots.map((slot, index) => (
            <ExerciseCard
              actions={actions}
              isFirst={index === 0}
              isLast={index === session.slots.length - 1}
              key={slot.id}
              number={index + 1}
              onOpenSheet={(setId, complete = false) =>
                setSheet({ complete, setId, slotId: slot.id })
              }
              onSetCompleted={onSetCompleted}
              slot={slot}
              tip={
                index === 0 && nextHint ? (
                  <FeatureTip hint={nextHint} onDismiss={() => hints.markSeen(nextHint.key)} />
                ) : null
              }
              workoutId={workoutId}
            />
          ))}
        </div>
      )}

      <Btn
        className={css.addExercise}
        icon={<PlusIcon aria-hidden='true' />}
        onClick={() => setPickerOpen(true)}
        radius='pill'
        variant='outlineMain'
      >
        Add exercise
      </Btn>
      <ExercisePickerDialog
        onOpenChange={setPickerOpen}
        onPick={(pick) => {
          actions.addExercise(pick);
          setPickerOpen(false);
        }}
        open={pickerOpen}
      />
      <SetSheet
        onClose={() => setSheet(null)}
        onSave={(patch) => {
          if (!sheetSlot || !sheetSet) return;
          if (!sheet?.complete) return actions.updateSet(sheetSet.id, patch);
          actions.updateSet(sheetSet.id, { ...patch, done: true });
          onSetCompleted(sheetSlot, { ...sheetSet, ...patch, done: true });
        }}
        target={
          sheetSlot && sheetSet
            ? { number: sheetSlot.sets.indexOf(sheetSet) + 1, set: sheetSet, slot: sheetSlot }
            : null
        }
      />
      {ownsTimer && !finished ? <RestDock timer={timer} /> : null}
    </div>
  );
}
