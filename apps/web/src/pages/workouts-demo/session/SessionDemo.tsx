import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { FeatureTip, HINTS } from '../hints/FeatureTip';
import { useSeenHints } from '../hints/useHints';
import { ExercisePickerDialog } from '../library/ExercisePicker';
import type { MockSet, MockSlot } from '../mockData';
import { RestBubble, RestDock, type RestVariant } from '../rest/RestTimer';
import { useRestTimer } from '../rest/useRestTimer';
import { ExerciseCard } from './ExerciseCard';
import { SessionHeader } from './SessionHeader';
import { SetSheet } from './SetSheet';
import type { CellMode } from './SetRow';
import { useMockSession } from './useMockSession';
import css from './Session.module.css';

/** Tips shown at the top of a session, one at a time, until each is dismissed. */
const SESSION_HINTS = ['drag', 'tick', 'sheet', 'longpress'];

type SessionDemoProps = { cellMode: CellMode; restVariant: RestVariant };

/** Live session mock: the screen you stare at between sets. */
export function SessionDemo({ cellMode, restVariant }: SessionDemoProps) {
  const { actions, slots } = useMockSession();
  const timer = useRestTimer();
  const hints = useSeenHints();
  const [restAfterSetId, setRestAfterSetId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheet, setSheet] = useState<{ slotId: string; setId: string } | null>(null);

  const sheetSlot = slots.find((slot) => slot.id === sheet?.slotId);
  const nextHint = HINTS.find(
    (hint) =>
      SESSION_HINTS.includes(hint.key) &&
      hints.seen !== null &&
      !hints.seen.includes(hint.key) &&
      (cellMode === 'drag' || (hint.key !== 'drag' && hint.key !== 'sheet')),
  );

  function onSetCompleted(slot: MockSlot, set: MockSet) {
    if (slot.restSeconds === null) return;
    setRestAfterSetId(set.id);
    timer.start(slot.restSeconds, slot.name);
  }

  return (
    <div className={css.session}>
      <SessionHeader onShowHints={hints.reset} slots={slots} />
      {nextHint ? (
        <FeatureTip hint={nextHint} onDismiss={() => hints.markSeen(nextHint.key)} />
      ) : null}

      <div className={css.cards}>
        {slots.map((slot) => (
          <ExerciseCard
            actions={actions}
            cellMode={cellMode}
            key={slot.id}
            onOpenSheet={(target, setId) => setSheet({ setId, slotId: target.id })}
            onSetCompleted={onSetCompleted}
            restAfterSetId={restAfterSetId}
            restVariant={restVariant}
            slot={slot}
            timer={timer}
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
        actions={actions}
        onClose={() => setSheet(null)}
        onCompleted={onSetCompleted}
        onNavigate={(setId) => setSheet((current) => current && { ...current, setId })}
        target={sheetSlot && sheet ? { setId: sheet.setId, slot: sheetSlot } : null}
      />

      {restVariant === 'dock' ? <RestDock timer={timer} /> : null}
      {restVariant === 'bubble' ? <RestBubble timer={timer} /> : null}
    </div>
  );
}
