import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronRightIcon, Trash2Icon } from 'lucide-react';
import {
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuRoot,
  ContextMenuTrigger,
} from '@/components/ui/context-menu/ContextMenu';
import type { RoutineSummary } from './routines.api';
import { routinesQueryOptions, useDeleteRoutineMutation } from './routines.query';
import css from './Routines.module.css';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { SHORT_DAY } from '../metrics';

/** How many exercise names a card shows before summing up the rest. */
const SHOWN_EXERCISES = 6;

/**
 * Routines as a grid of cards: each shows what the routine holds and opens its page. Long press or
 * right click deletes it. Starting one straight away lives in the floating button.
 */
export function RoutineList() {
  const { t } = useI18n();
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
        <ul className={css.grid}>
          {routines.map((routine) => (
            <li key={routine.id}>
              <ContextMenuRoot>
                <ContextMenuTrigger
                  render={
                    <Link
                      className={css.card}
                      params={{ id: routine.id }}
                      to='/workouts/routines/$id'
                    />
                  }
                >
                  <RoutineCardContent routine={routine} />
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

function RoutineCardContent({ routine }: { routine: RoutineSummary }) {
  const { formatDate, t } = useI18n();
  const hidden = routine.exerciseNames.length - SHOWN_EXERCISES;

  return (
    <>
      <span className={css.name}>{routine.name}</span>
      {routine.description ? (
        <span className={css.description}>{routine.description}</span>
      ) : (
        <span />
      )}
      {routine.exerciseNames.length > 0 ? (
        <ul className={css.exercises}>
          {routine.exerciseNames.slice(0, SHOWN_EXERCISES).map((name, index) => (
            <li key={`${name}-${index}`}>{name}</li>
          ))}
          {hidden > 0 ? <li>+{hidden}</li> : null}
        </ul>
      ) : (
        <span className={css.description}>{t({ en: 'No exercises', pl: 'Brak ćwiczeń' })}</span>
      )}
      <span className={css.footer}>
        <span>
          {routine.lastUsed
            ? t({
                en: `Last done ${formatDate(routine.lastUsed, SHORT_DAY)}`,
                pl: `Ostatnio ${formatDate(routine.lastUsed, SHORT_DAY)}`,
              })
            : t({ en: 'Not done yet', pl: 'Jeszcze nie wykonany' })}
        </span>
        <ChevronRightIcon aria-hidden='true' />
      </span>
    </>
  );
}
