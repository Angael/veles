import { Link, useNavigate } from '@tanstack/react-router';
import { PlayIcon, PlusIcon } from 'lucide-react';
import { FloatingButton } from '@/components/ui/floating-button/FloatingButton';
import { todayLocalDate } from '@/lib/dateOnly';
import { ElapsedTime } from '../ElapsedTime';
import type { WorkoutSummary } from '../workouts.api';
import { useStartWorkoutMutation } from '../workouts.query';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * Floating button that starts an empty workout. While a workout is open it turns into a
 * "Continue" link with the live clock, because only one workout can be open at a time.
 * Routines start from their own page.
 */
export function StartWorkoutButton({ active }: { active: WorkoutSummary | undefined }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const startWorkout = useStartWorkoutMutation();

  if (active) {
    return (
      <FloatingButton
        icon={<PlayIcon aria-hidden='true' />}
        render={<Link params={{ id: active.id }} to='/workouts/$id' />}
      >
        {t({ en: 'Continue', pl: 'Kontynuuj' })} ·{' '}
        {active.startedAt ? <ElapsedTime startedAt={active.startedAt} /> : active.name}
      </FloatingButton>
    );
  }

  return (
    <FloatingButton
      icon={<PlusIcon aria-hidden='true' />}
      loading={startWorkout.isPending}
      onClick={() =>
        startWorkout.mutate(
          { date: todayLocalDate() },
          { onSuccess: ({ id }) => void navigate({ params: { id }, to: '/workouts/$id' }) },
        )
      }
    >
      {t({ en: 'Empty workout', pl: 'Pusty trening' })}
    </FloatingButton>
  );
}
