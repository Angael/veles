import { useNavigate } from '@tanstack/react-router';
import { FlagIcon } from 'lucide-react';
import { Btn } from '@/components/ui/btn/Btn';
import { useUpdateWorkoutMutation } from '../workouts.query';
import { finishWorkout } from './finishWorkout';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * Finish for a running workout. It sits in the sticky task header, so it stays in reach at any
 * scroll position. Finishing drops the rest timer and leaves for the workouts list.
 */
export function FinishWorkoutButton({ workoutId }: { workoutId: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const updateWorkout = useUpdateWorkoutMutation();

  return (
    <Btn
      aria-label={t({ en: 'Finish workout', pl: 'Zakończ trening' })}
      className={css.finish}
      icon={<FlagIcon aria-hidden='true' />}
      loading={updateWorkout.isPending}
      onClick={() =>
        void finishWorkout(workoutId, {
          finish: updateWorkout.mutateAsync,
          leave: () => void navigate({ replace: true, to: '/workouts' }),
        })
      }
      radius='pill'
      size='sm'
    >
      {t({ en: 'Finish', pl: 'Zakończ' })}
    </Btn>
  );
}
