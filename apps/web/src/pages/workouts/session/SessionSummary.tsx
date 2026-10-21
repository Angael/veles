import { useNavigate } from '@tanstack/react-router';
import { FlagIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { Card } from '@/components/ui/card/Card';
import { floorDuration, formatDuration } from '../metrics';
import { useUpdateWorkoutMutation } from '../workouts.query';
import type { WorkoutSessionData } from '../workouts.server';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

type SessionSummaryProps = {
  onFinish: () => void;
  session: WorkoutSessionData;
};

/**
 * Day and elapsed time of the session, with Finish while it runs. Name and rare actions (rename,
 * reopen, move) live in the task header above.
 */
export function SessionSummary({ onFinish, session }: SessionSummaryProps) {
  const { formatDate, t } = useI18n();
  const navigate = useNavigate();
  const updateWorkout = useUpdateWorkoutMutation();
  const setSeconds = session.slots
    .flatMap((slot) => slot.sets)
    .reduce((sum, set) => sum + (set.durationSeconds ?? 0), 0);
  const elapsed = floorDuration(useElapsed(session.startedAt, session.endedAt), setSeconds);
  const finished = session.endedAt !== null;

  return (
    <Card className={css.summary}>
      <dl className={css.stats}>
        <div>
          <dt>{t({ en: 'Day', pl: 'Dzień' })}</dt>
          <dd>
            <time dateTime={session.date}>
              {formatDate(session.date, { day: 'numeric', month: 'short', weekday: 'short' })}
            </time>
          </dd>
        </div>
        <div>
          <dt>{t({ en: 'Time', pl: 'Czas' })}</dt>
          <dd className={css.timeValue}>{elapsed === null ? '—' : formatDuration(elapsed)}</dd>
        </div>
      </dl>
      {finished ? (
        <span className={css.finishedBadge}>{t({ en: 'Finished', pl: 'Zakończony' })}</span>
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
        >
          {t({ en: 'Finish', pl: 'Zakończ' })}
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
