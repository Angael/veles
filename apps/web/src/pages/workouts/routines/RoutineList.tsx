import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRightIcon, Trash2Icon } from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import { routinesQueryOptions, useDeleteRoutineMutation } from './routines.query';
import css from './Routines.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { SHORT_DAY } from '../metrics';

/**
 * Routines panel: each row shows what the routine holds and opens its page. Long press or right
 * click deletes it.
 */
export function RoutineList() {
  const { formatDate, t } = useI18n();
  const { data: routines } = useSuspenseQuery(routinesQueryOptions());
  const deleteRoutine = useDeleteRoutineMutation();

  return (
    <section aria-labelledby='routines-title' className={css.panel} data-appear='3'>
      <h2 id='routines-title'>{t({ en: 'Routines', pl: 'Plany' })}</h2>
      {routines.length === 0 ? (
        <p className={css.hint}>
          {t({
            en: 'Finish a workout you like, then use its ⋯ menu to save it as a routine.',
            pl: 'Zakończ trening, który Ci odpowiada, a potem zapisz go jako plan w menu ⋯.',
          })}
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
                      {routine.exerciseNames.join(' · ') ||
                        t({ en: 'No exercises', pl: 'Brak ćwiczeń' })}
                    </span>
                    <span className={css.lastUsed}>
                      {routine.lastUsed
                        ? t({
                            en: `Last done ${formatDate(routine.lastUsed, SHORT_DAY)}`,
                            pl: `Ostatnio ${formatDate(routine.lastUsed, SHORT_DAY)}`,
                          })
                        : t({ en: 'Not done yet', pl: 'Jeszcze nie wykonany' })}
                    </span>
                  </span>
                  <ChevronRightIcon aria-hidden='true' />
                </ContextMenuTrigger>
                <ContextMenuPopup
                  aria-label={t({ en: `${routine.name} actions`, pl: `Akcje: ${routine.name}` })}
                >
                  <ContextMenuItem
                    icon={<Trash2Icon aria-hidden='true' />}
                    label={t({ en: 'Delete routine', pl: 'Usuń plan' })}
                    onClick={() => {
                      if (
                        window.confirm(
                          t({
                            en: `Delete routine “${routine.name}”? Past workouts stay.`,
                            pl: `Usunąć plan „${routine.name}”? Wcześniejsze treningi zostaną.`,
                          }),
                        )
                      ) {
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
