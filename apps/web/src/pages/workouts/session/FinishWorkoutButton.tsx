import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FlagIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { useUpdateWorkoutMutation } from '../workouts.query';
import { finishWorkout } from './finishWorkout';
import { settleSessionEdits } from './session.query';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * Finish for a running workout. It sits in the sticky task header, so it stays in reach at any
 * scroll position. It first sends edits still waiting to save, then finishes, saving the grey
 * hints of unfilled sets, drops the rest timer and leaves for the workouts list.
 */
export function FinishWorkoutButton({ workoutId }: { workoutId: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateWorkout = useUpdateWorkoutMutation();
  const [settling, setSettling] = useState(false);

  async function finish() {
    setSettling(true);
    try {
      await settleSessionEdits(queryClient, workoutId);
    } finally {
      setSettling(false);
    }
    await finishWorkout(workoutId, {
      finish: (variables) => updateWorkout.mutateAsync({ ...variables, fillHints: true }),
      leave: () => void navigate({ replace: true, to: '/workouts' }),
    });
  }

  return (
    <Btn
      aria-label={t({ en: 'Finish workout', pl: 'Zakończ trening' })}
      className={css.finish}
      icon={<FlagIcon aria-hidden='true' />}
      loading={settling || updateWorkout.isPending}
      onClick={() => void finish()}
      radius='pill'
      size='sm'
    >
      {t({ en: 'Finish', pl: 'Zakończ' })}
    </Btn>
  );
}
