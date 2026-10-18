import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { FeatureTip, HINTS } from '../../workouts/hints/FeatureTip';
import { useSeenHints } from '../../workouts/hints/useHints';
import { ExercisePickerDialog } from '../library/ExercisePicker';
import type { MockSet, MockSlot } from '../mockData';
import { RestDock } from '../../workouts/rest/RestTimer';
import { useRestTimer } from '../../workouts/rest/useRestTimer';
import { ExerciseCard } from './ExerciseCard';
import { SessionHeader } from './SessionHeader';
import { SetSheet } from './SetSheet';
import { useMockSession } from './useMockSession';
import css from './Session.module.css';

/** Tips shown in the first exercise card, one at a time, until each is dismissed. */
const SESSION_HINTS = ['drag', 'longpress'];

/** Live session mock: the screen you stare at between sets. */
export function SessionDemo() {
  const { actions, slots } = useMockSession();
  const timer = useRestTimer();
  const hints = useSeenHints();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheet, setSheet] = useState<{ slotId: string; setId: string } | null>(null);

  const sheetSlot = slots.find((slot) => slot.id === sheet?.slotId);
  const sheetSet = sheetSlot?.sets.find((set) => set.id === sheet?.setId);
  const nextHint = HINTS.find(
    (hint) =>
      SESSION_HINTS.includes(hint.key) && hints.seen !== null && !hints.seen.includes(hint.key),
  );

  /**
   * Starts rest after a ticked set. Ticking a set that sits before an already done one is
   * catching up on forgotten ticks, so it leaves the running timer alone.
   */
  function onSetCompleted(slot: MockSlot, set: MockSet) {
    if (slot.restSeconds === null) return;
    const index = slot.sets.findIndex((item) => item.id === set.id);
    if (slot.sets.slice(index + 1).some((item) => item.done)) return;
    timer.start(slot.restSeconds, slot.name);
  }

  return (
    <div className={css.session}>
      <SessionHeader onShowHints={hints.reset} slots={slots} />

      <div className={css.cards}>
        {slots.map((slot, index) => (
          <ExerciseCard
            actions={actions}
            key={slot.id}
            number={index + 1}
            onOpenSheet={(target, setId) => setSheet({ setId, slotId: target.id })}
            onSetCompleted={onSetCompleted}
            slot={slot}
            tip={
              index === 0 && nextHint ? (
                <FeatureTip hint={nextHint} onDismiss={() => hints.markSeen(nextHint.key)} />
              ) : null
            }
          />
        ))}
      </div>

      <Btn
        icon={<PlusIcon aria-hidden='true' />}
        onClick={() => setPickerOpen(true)}
        radius='pill'
        variant='outlineMain'
      >
        Add exercise
      </Btn>
      <ExercisePickerDialog
        onOpenChange={setPickerOpen}
        onPick={(exercise) => {
          actions.addSlot(exercise.name, exercise.measure);
          setPickerOpen(false);
        }}
        open={pickerOpen}
      />
      <SetSheet
        onClose={() => setSheet(null)}
        onSave={(patch) =>
          sheetSlot && sheetSet && actions.updateSet(sheetSlot.id, sheetSet.id, patch)
        }
        target={
          sheetSlot && sheetSet
            ? { number: sheetSlot.sets.indexOf(sheetSet) + 1, set: sheetSet, slot: sheetSlot }
            : null
        }
      />

      <RestDock timer={timer} />
    </div>
  );
}
