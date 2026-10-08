import { useNavigate } from '@tanstack/react-router';
import { CircleHelpIcon, FlagIcon, RotateCcwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { SeamlessTextInput } from '@/components/ui/seamless-text-input/SeamlessTextInput';
import { formatDuration } from '../metrics';
import { useUpdateWorkoutMutation } from '../workouts.query';
import type { WorkoutSessionData } from '../workouts.server';
import { SessionMenu } from './SessionMenu';
import css from './Session.module.css';

type SessionHeaderProps = {
  onFinish: () => void;
  onShowHints: () => void;
  session: WorkoutSessionData;
};

/** Workout name, elapsed time, a "?" to replay the tips, and Finish (Reopen once finished). */
export function SessionHeader({ onFinish, onShowHints, session }: SessionHeaderProps) {
  const navigate = useNavigate();
  const updateWorkout = useUpdateWorkoutMutation();
  const elapsed = useElapsed(session.startedAt, session.endedAt);
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
      <SessionMenu session={session} />
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
              {
                onSuccess: () => {
                  onFinish();
                  void navigate({ replace: true, to: '/workouts' });
                },
              },
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
