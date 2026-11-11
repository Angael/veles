import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FlagIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { useUpdateWorkoutMutation, workoutKeys } from '../workouts.query';
import type { WorkoutSessionData } from '../workouts.server';
import { finishWorkout } from './finishWorkout';
import { settleSessionEdits } from './session.query';
import {
  type UnfilledExercise,
  type UnfilledSets,
  UnfilledSetsDialog,
  unfilledExercises,
} from './UnfilledSetsDialog';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * Finish for a running workout. It sits in the sticky task header, so it stays in reach at any
 * scroll position. It first sends edits still waiting to save, then asks about sets that only
 * show grey hints, then finishes, drops the rest timer and leaves for the workouts list.
 */
export function FinishWorkoutButton({ workoutId }: { workoutId: string }) {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateWorkout = useUpdateWorkoutMutation();
  const [settling, setSettling] = useState(false);
  const [unfilled, setUnfilled] = useState<UnfilledExercise[]>([]);

  const finish = (unfilledSets?: UnfilledSets) =>
    void finishWorkout(workoutId, {
      finish: (variables) => updateWorkout.mutateAsync({ ...variables, unfilledSets }),
      leave: () => void navigate({ replace: true, to: '/workouts' }),
    });

  async function start() {
    setSettling(true);
    try {
      await settleSessionEdits(queryClient, workoutId);
    } finally {
      setSettling(false);
    }
    const session = queryClient.getQueryData<WorkoutSessionData>(workoutKeys.session(workoutId));
    const pending = session ? unfilledExercises(session, locale) : [];
    if (pending.length > 0) return setUnfilled(pending);
    finish();
  }

  return (
    <>
      <Btn
        aria-label={t({ en: 'Finish workout', pl: 'Zakończ trening' })}
        className={css.finish}
        icon={<FlagIcon aria-hidden='true' />}
        loading={settling || (updateWorkout.isPending && unfilled.length === 0)}
        onClick={() => void start()}
        radius='pill'
        size='sm'
      >
        {t({ en: 'Finish', pl: 'Zakończ' })}
      </Btn>
      <UnfilledSetsDialog
        exercises={unfilled}
        onClose={() => setUnfilled([])}
        onFinish={finish}
        pending={updateWorkout.isPending}
      />
    </>
  );
}
