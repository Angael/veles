import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FlagIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { useUpdateWorkoutMutation, workoutSessionQueryOptions } from '../workouts.query';
import type { WorkoutSlotData } from '../workouts.server';
import { FinishReviewDialog } from './FinishReviewDialog';
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
  const [review, setReview] = useState<WorkoutSlotData[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);

  async function finish(skipSlotIds?: string[]) {
    await finishWorkout(
      workoutId,
      {
        finish: (variables) => updateWorkout.mutateAsync({ ...variables, fillHints: true }),
        leave: () => void navigate({ replace: true, to: '/workouts' }),
      },
      skipSlotIds,
    );
  }

  /** Saves pending edits, then asks about exercises without a ticked set, or finishes at once. */
  async function start() {
    setSettling(true);
    try {
      await settleSessionEdits(queryClient, workoutId);
    } finally {
      setSettling(false);
    }
    const session = queryClient.getQueryData(workoutSessionQueryOptions(workoutId).queryKey);
    const untouched = session?.slots.filter((slot) => !slot.sets.some((set) => set.done)) ?? [];
    if (!untouched.length) return finish();
    setReview(untouched);
    setReviewOpen(true);
  }

  return (
    <>
      <Btn
        aria-label={t({ en: 'Finish workout', pl: 'Zakończ trening' })}
        className={css.finish}
        icon={<FlagIcon aria-hidden='true' />}
        loading={settling || updateWorkout.isPending}
        onClick={() => void start()}
        radius='pill'
        size='sm'
      >
        {t({ en: 'Finish', pl: 'Zakończ' })}
      </Btn>
      <FinishReviewDialog
        loading={updateWorkout.isPending}
        onFinish={(skipSlotIds) => void finish(skipSlotIds)}
        onOpenChange={setReviewOpen}
        open={reviewOpen}
        slots={review}
      />
    </>
  );
}
