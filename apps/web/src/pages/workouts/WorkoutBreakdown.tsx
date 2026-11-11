import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Skeleton } from '@/components/ui/skeleton/Skeleton';
import { describeSet, SET_BADGE, SET_TYPE_LABELS } from './metrics';
import type { WorkoutSessionData } from './workouts.server';
import { workoutSessionQueryOptions } from './workouts.query';
import css from './WorkoutBreakdown.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * What a workout held: its clock times and each exercise with the sets done and its note. Reads
 * the session the workout page loads, so opening the workout after this is instant.
 */
export function WorkoutBreakdown({ workoutId }: { workoutId: string }) {
  const { data } = useQuery(workoutSessionQueryOptions(workoutId));

  if (!data) return <Skeleton className={css.loading} />;
  return (
    <div className={css.breakdown}>
      <ClockRange session={data} />
      {data.slots.length > 0 ? (
        <ol className={css.exercises}>
          {data.slots.map((slot) => (
            <ExerciseLine key={slot.id} slot={slot} />
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** "18:02 – 19:17", or only the start while the workout runs. */
function ClockRange({ session }: { session: WorkoutSessionData }) {
  const { formatDate, t } = useI18n();
  if (!session.startedAt) return null;
  const clock = (value: string) => formatDate(value, { hour: '2-digit', minute: '2-digit' });

  return (
    <p className={css.clock}>
      <time dateTime={session.startedAt}>{clock(session.startedAt)}</time>
      {session.endedAt ? (
        <>
          {' – '}
          <time dateTime={session.endedAt}>{clock(session.endedAt)}</time>
        </>
      ) : (
        ` – ${t({ en: 'now', pl: 'teraz' })}`
      )}
    </p>
  );
}

function ExerciseLine({ slot }: { slot: WorkoutSessionData['slots'][number] }) {
  const { locale, t } = useI18n();
  const done = slot.sets.filter((set) => set.done);

  return (
    <li className={css.exercise}>
      <strong>{slot.name}</strong>
      {done.length > 0 ? (
        <ul className={css.sets}>
          {done.map((set) => (
            <li
              className={clsx(set.type === 'warmup' && css.warmup)}
              key={set.id}
              title={set.type === 'normal' ? undefined : t(SET_TYPE_LABELS[set.type])}
            >
              {set.type === 'normal' ? null : <b>{t(SET_BADGE[set.type])}</b>}
              {describeSet(set, locale)}
            </li>
          ))}
        </ul>
      ) : (
        <span className={css.none}>{t({ en: 'No sets done', pl: 'Brak zrobionych serii' })}</span>
      )}
      {slot.note ? <p className={css.note}>{slot.note}</p> : null}
    </li>
  );
}
