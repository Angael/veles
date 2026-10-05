import { FlagIcon, PlusIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { toastManager } from '@/components/ui/toast/toastManager';
import { ExercisePickerDialog } from '../library/ExercisePicker';
import { formatDuration, type MockSet, type MockSlot } from '../mockData';
import { RestBubble, RestDock, type RestVariant } from '../rest/RestTimer';
import { useRestTimer } from '../rest/useRestTimer';
import { ExerciseCard } from './ExerciseCard';
import { useMockSession } from './useMockSession';
import css from './Session.module.css';

const startedAt = Date.now() - 23 * 60 * 1000;

/** Live session mock: the screen you stare at between sets. */
export function SessionDemo({ restVariant }: { restVariant: RestVariant }) {
  const { actions, slots } = useMockSession();
  const timer = useRestTimer();
  const [restAfterSetId, setRestAfterSetId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const elapsed = useElapsed();

  const doneSets = slots.flatMap((slot) => slot.sets.filter((set) => set.done));
  const volume = doneSets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0);

  function onSetCompleted(slot: MockSlot, set: MockSet) {
    if (slot.restSeconds === null) return;
    setRestAfterSetId(set.id);
    timer.start(slot.restSeconds, slot.name);
  }

  return (
    <div className={css.session}>
      <Card className={css.sessionHeader}>
        <SeamlessTextInput aria-label='Workout name' defaultValue='Push-ish Monday' />
        <dl className={css.stats}>
          <div>
            <dt>Time</dt>
            <dd>{formatDuration(elapsed)}</dd>
          </div>
          <div>
            <dt>Sets</dt>
            <dd>{doneSets.length}</dd>
          </div>
          <div>
            <dt>Volume</dt>
            <dd>{volume.toLocaleString()} kg</dd>
          </div>
        </dl>
        <Btn
          icon={<FlagIcon aria-hidden='true' />}
          onClick={() => toastManager.add({ title: 'Mock: workout saved', type: 'success' })}
          radius='pill'
          size='sm'
        >
          Finish
        </Btn>
      </Card>

      <div className={css.cards}>
        {slots.map((slot) => (
          <ExerciseCard
            actions={actions}
            key={slot.id}
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

      {restVariant === 'dock' ? <RestDock timer={timer} /> : null}
      {restVariant === 'bubble' ? <RestBubble timer={timer} /> : null}
    </div>
  );
}

function useElapsed() {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  return Math.max(0, (now - startedAt) / 1000);
}
