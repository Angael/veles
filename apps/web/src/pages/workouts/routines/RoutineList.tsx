import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { format, parseISO } from 'date-fns';
import { ChevronRightIcon, Trash2Icon } from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { routinesQueryOptions, useDeleteRoutineMutation } from './routines.query';
import css from './Routines.module.css';

/**
 * Routines panel: each row shows what the routine holds and opens its page. Long press or right
 * click deletes it.
 */
export function RoutineList() {
  const { data: routines } = useSuspenseQuery(routinesQueryOptions());
  const deleteRoutine = useDeleteRoutineMutation();

  return (
    <section aria-labelledby='routines-title' className={css.panel} data-appear='3'>
      <h2 id='routines-title'>Routines</h2>
      {routines.length === 0 ? (
        <p className={css.hint}>
          Finish a workout you like, then use its ⋯ menu to save it as a routine.
        </p>
      ) : (
        <ul className={css.list}>
          {routines.map((routine) => (
            <li key={routine.id}>
              <ContextMenuRoot>
                <ContextMenuTrigger
                  render={
                    <Link
                      className={css.row}
                      params={{ id: routine.id }}
                      to='/workouts/routines/$id'
                    />
                  }
                >
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
                </ContextMenuTrigger>
                <ContextMenuPopup aria-label={`${routine.name} actions`}>
                  <ContextMenuItem
                    icon={<Trash2Icon aria-hidden='true' />}
                    label='Delete routine'
                    onClick={() => {
                      if (window.confirm(`Delete routine “${routine.name}”? Past workouts stay.`)) {
                        deleteRoutine.mutate({ id: routine.id });
                      }
                    }}
                    variant='danger'
                  />
                </ContextMenuPopup>
              </ContextMenuRoot>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
