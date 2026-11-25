import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { FlagIcon } from 'lucide-react';
import { useState } from 'react';
import { Btn } from '@/components/ui/btn/Btn';
import { useUpdateWorkoutMutation, workoutSessionQueryOptions } from '../workouts.query';
import { finishSuggestions, type SuggestedExercise } from './finishSuggestions';
import { FinishSuggestionsDialog } from './FinishSuggestionsDialog';
import { finishWorkout } from './finishWorkout';
import { settleSessionEdits } from './session.query';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/**
 * Finish for a running workout. It sits in the sticky task header, so it stays in reach at any
 * scroll position. It first sends edits still waiting to save. When unticked sets hold values
 * (typed or last time's), it asks which were done; otherwise it finishes at once, drops the rest timer and
 * leaves for the workouts list.
 */
export function FinishWorkoutButton({ workoutId }: { workoutId: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateWorkout = useUpdateWorkoutMutation();
  const [settling, setSettling] = useState(false);
  /** Each Finish tap that needs a review gets a fresh one: new sets, new key, nothing ticked. */
  const [review, setReview] = useState<{ exercises: SuggestedExercise[]; key: number }>({
    exercises: [],
    key: 0,
  });
  const [asking, setAsking] = useState(false);

  async function finish(acceptSetIds: string[] = []) {
    await finishWorkout(workoutId, {
      finish: (variables) => updateWorkout.mutateAsync({ ...variables, acceptSetIds }),
      leave: () => void navigate({ replace: true, to: '/workouts' }),
    });
  }

  async function start() {
    setSettling(true);
    try {
      await settleSessionEdits(queryClient, workoutId);
    } finally {
      setSettling(false);
    }
    const session = queryClient.getQueryData(workoutSessionQueryOptions(workoutId).queryKey);
    const pending = session ? finishSuggestions(session) : [];
    if (pending.length === 0) return finish();
    setReview((current) => ({ exercises: pending, key: current.key + 1 }));
    setAsking(true);
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
      <FinishSuggestionsDialog
        exercises={review.exercises}
        key={review.key}
        loading={updateWorkout.isPending}
        onFinish={(acceptSetIds) => void finish(acceptSetIds)}
        onOpenChange={setAsking}
        open={asking}
      />
    </>
  );
}
