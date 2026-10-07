import { useNavigate } from '@tanstack/react-router';
import { CircleHelpIcon, FlagIcon, RotateCcwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { formatDuration } from '../metrics';
import { useUpdateWorkoutMutation } from '../workouts.query';
import type { WorkoutSessionData } from '../workouts.server';
import css from './Session.module.css';

type SessionHeaderProps = { onShowHints: () => void; session: WorkoutSessionData };

/** Workout name, live totals, a "?" to replay the tips, and Finish (Reopen once finished). */
export function SessionHeader({ onShowHints, session }: SessionHeaderProps) {
  const navigate = useNavigate();
  const updateWorkout = useUpdateWorkoutMutation();
  const elapsed = useElapsed(session.startedAt, session.endedAt);
  const doneSets = session.slots.flatMap((slot) => slot.sets.filter((set) => set.done));
  const volume = doneSets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
  const finished = session.endedAt !== null;

  return (
    <Card className={css.sessionHeader}>
      <SeamlessTextInput
        aria-label='Workout name'
        defaultValue={session.name}
        key={session.name}
        onBlur={(event) => {
          const name = event.target.value.trim();
          if (name && name !== session.name) updateWorkout.mutate({ id: session.id, name });
        }}
        onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
      />
      <dl className={css.stats}>
        <div>
          <dt>Time</dt>
          <dd>{elapsed === null ? '—' : formatDuration(elapsed)}</dd>
        </div>
        <div>
          <dt>Sets</dt>
          <dd>{doneSets.length}</dd>
        </div>
        <div>
          <dt>Volume</dt>
          <dd>{Math.round(volume).toLocaleString()} kg</dd>
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
      {finished ? (
        <Btn
          disabled={updateWorkout.isPending}
          icon={<RotateCcwIcon aria-hidden='true' />}
          onClick={() => updateWorkout.mutate({ finished: false, id: session.id })}
          radius='pill'
          size='sm'
          variant='outlineMain'
        >
          Reopen
        </Btn>
      ) : (
        <Btn
          disabled={updateWorkout.isPending}
          icon={<FlagIcon aria-hidden='true' />}
          onClick={() =>
            updateWorkout.mutate(
              { finished: true, id: session.id },
              { onSuccess: () => void navigate({ replace: true, to: '/workouts' }) },
            )
          }
          radius='pill'
          size='sm'
        >
          Finish
        </Btn>
      )}
    </Card>
  );
}

/** Seconds since start, ticking while the workout runs; fixed once it has ended. */
function useElapsed(startedAt: string | null, endedAt: string | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (endedAt) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endedAt]);
  if (!startedAt) return null;
  const end = endedAt ? Date.parse(endedAt) : now;
  return end === null ? null : Math.max(0, (end - Date.parse(startedAt)) / 1000);
}
