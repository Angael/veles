import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { PencilIcon, PlayIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { todayLocalDate } from '@/lib/dateOnly';
import type { RoutineSummary } from './routines.api';
import { RoutineDialog } from './RoutineDialog';
import {
  routinesQueryOptions,
  useDeleteRoutineMutation,
  useStartRoutineMutation,
  useUpdateRoutineMutation,
} from './routines.query';
import css from './Routines.module.css';

/**
 * Routine cards: tap starts a workout with the routine's exercises, long press or right click
 * edits the name and description or deletes it.
 */
export function RoutineList() {
  const { data: routines } = useSuspenseQuery(routinesQueryOptions());
  const navigate = useNavigate();
  const startRoutine = useStartRoutineMutation();
  const updateRoutine = useUpdateRoutineMutation();
  const deleteRoutine = useDeleteRoutineMutation();
  const [editing, setEditing] = useState<RoutineSummary | null>(null);

  if (routines.length === 0) {
    return (
      <p className={css.hint}>
        Finish a workout you like, then use its ⋯ menu to save it as a routine.
      </p>
    );
  }

  return (
    <>
      <ul aria-label='Routines' className={css.list}>
        {routines.map((routine) => (
          <li key={routine.id}>
            <ContextMenuRoot>
              <ContextMenuTrigger
                render={
                  <button
                    aria-busy={
                      startRoutine.isPending && startRoutine.variables.routineId === routine.id
                    }
                    className={css.card}
                    disabled={startRoutine.isPending}
                    onClick={() =>
                      startRoutine.mutate(
                        { date: todayLocalDate(), routineId: routine.id },
                        {
                          onSuccess: ({ id }) =>
                            void navigate({ params: { id }, to: '/workouts/$id' }),
                        },
                      )
                    }
                    type='button'
                  />
                }
              >
                <span className={css.cardTitle}>
                  <PlayIcon aria-hidden='true' />
                  {routine.name}
                </span>
                {routine.description ? (
                  <span className={css.description}>{routine.description}</span>
                ) : null}
                <span className={css.exercises}>
                  {routine.exerciseNames.join(' · ') || 'No exercises'}
                </span>
              </ContextMenuTrigger>
              <ContextMenuPopup aria-label={`${routine.name} actions`}>
                <ContextMenuItem
                  icon={<PencilIcon aria-hidden='true' />}
                  label='Edit name and description'
                  onClick={() => setEditing(routine)}
                />
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
      <RoutineDialog
        defaults={{ description: editing?.description ?? '', name: editing?.name ?? '' }}
        key={editing?.id}
        onOpenChange={(open) => !open && setEditing(null)}
        onSubmit={(values) =>
          editing ? updateRoutine.mutateAsync({ id: editing.id, ...values }) : Promise.resolve()
        }
        open={editing !== null}
        pending={updateRoutine.isPending}
        submitLabel='Save'
        title='Edit routine'
      />
    </>
  );
}
