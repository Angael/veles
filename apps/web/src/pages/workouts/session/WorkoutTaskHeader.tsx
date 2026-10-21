import { useSuspenseQuery } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import { workoutSessionQueryOptions } from '../workouts.query';
import { RenameWorkoutDialog } from './RenameWorkoutDialog';
import { SessionMenu } from './SessionMenu';
import css from './Session.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';

/** The open session, already loaded by the route, for the task header around the page. */
function useRouteSession() {
  const { id } = useParams({ from: '/_authenticated/workouts/$id' });
  return useSuspenseQuery(workoutSessionQueryOptions(id)).data;
}

/** Workout name as the page title; tapping it opens the rename dialog. */
export function WorkoutTitle() {
  const { t } = useI18n();
  const session = useRouteSession();
  const [renaming, setRenaming] = useState(false);

  return (
    <>
      <button
        aria-label={t({ en: `Rename ${session.name}`, pl: `Zmień nazwę: ${session.name}` })}
        className={css.titleButton}
        onClick={() => setRenaming(true)}
        type='button'
      >
        {session.name}
      </button>
      <RenameWorkoutDialog onOpenChange={setRenaming} open={renaming} session={session} />
    </>
  );
}

export function WorkoutActions() {
  return <SessionMenu session={useRouteSession()} />;
}
