import { CircleHelpIcon, FlagIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { toastManager } from '@/components/ui/toast/toastManager';
import { formatDuration } from '../../workouts/metrics';
import type { MockSlot } from '../mockData';
import css from './Session.module.css';

const startedAt = Date.now() - 23 * 60 * 1000;

type SessionHeaderProps = { onShowHints: () => void; slots: MockSlot[] };

/** Workout name, live totals, a "?" to replay the tips, and Finish. */
export function SessionHeader({ onShowHints, slots }: SessionHeaderProps) {
  const elapsed = useElapsed();
  const doneSets = slots.flatMap((slot) => slot.sets.filter((set) => set.done));
  const volume = doneSets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0);

  return (
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
        aria-label='Show tips again'
        icon={<CircleHelpIcon aria-hidden='true' />}
        iconOnly
        onClick={onShowHints}
        radius='pill'
        size='sm'
        variant='ghost'
      />
      <Btn
        icon={<FlagIcon aria-hidden='true' />}
        onClick={() => toastManager.add({ title: 'Mock: workout saved', type: 'success' })}
        radius='pill'
        size='sm'
      >
        Finish
      </Btn>
    </Card>
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
