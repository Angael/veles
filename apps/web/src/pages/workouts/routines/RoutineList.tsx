import { useSuspenseQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ChevronRightIcon } from 'lucide-react';
import { useState } from 'react';
import type { RoutineSummary } from './routines.api';
import { RoutineDialog } from './RoutineDialog';
import {
  routinesQueryOptions,
  useDeleteRoutineMutation,
  useUpdateRoutineMutation,
} from './routines.query';
import css from './Routines.module.css';

/**
 * Routines panel: each row shows what the routine holds and opens it to view its exercises, edit
 * the name and description, or delete it. Starting a routine lives in the floating start menu.
 */
export function RoutineList() {
  const { data: routines } = useSuspenseQuery(routinesQueryOptions());
  const updateRoutine = useUpdateRoutineMutation();
  const deleteRoutine = useDeleteRoutineMutation();
  const [viewing, setViewing] = useState<RoutineSummary | null>(null);

  return (
    <section aria-labelledby='routines-title' className={css.panel}>
      <h2 id='routines-title'>Routines</h2>
      {routines.length === 0 ? (
        <p className={css.hint}>
          Finish a workout you like, then use its ⋯ menu to save it as a routine.
        </p>
      ) : (
        <ul className={css.list}>
          {routines.map((routine) => (
            <li key={routine.id}>
              <button className={css.row} onClick={() => setViewing(routine)} type='button'>
                <span className={css.rowText}>
                  <span className={css.rowName}>{routine.name}</span>
                  <span className={css.exercises}>
                    {routine.exerciseNames.join(' · ') || 'No exercises'}
                  </span>
                  <span className={css.lastUsed}>
                    {routine.lastUsed
                      ? `Last done ${format(parseISO(routine.lastUsed), 'EEE dd.MM')}`
                      : 'Not done yet'}
                  </span>
                </span>
                <ChevronRightIcon aria-hidden='true' />
              </button>
            </li>
          ))}
        </ul>
      )}
      <RoutineDialog
        defaults={{ description: viewing?.description ?? '', name: viewing?.name ?? '' }}
        exerciseNames={viewing?.exerciseNames}
        key={viewing?.id}
        onDelete={() => {
          if (viewing && window.confirm(`Delete routine “${viewing.name}”? Past workouts stay.`)) {
            deleteRoutine.mutate({ id: viewing.id });
            setViewing(null);
          }
        }}
        onOpenChange={(open) => !open && setViewing(null)}
        onSubmit={(values) =>
          viewing ? updateRoutine.mutateAsync({ id: viewing.id, ...values }) : Promise.resolve()
        }
        open={viewing !== null}
        pending={updateRoutine.isPending}
        submitLabel='Save'
        title='Routine'
      />
    </section>
  );
}
